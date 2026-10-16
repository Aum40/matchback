"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendAssistantMessageAction } from "@/lib/actions/assistant.action";
import type { AssistantMessage, AssistantResponse } from "@/lib/api/api.type";
import { cn } from "@/lib/utils";
import { Bot, MessageCircle, RotateCcw, Send, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type ChatEntry = AssistantMessage & { source?: AssistantResponse["source"] };

const MAX_MESSAGES = 20;
const MAX_TOTAL_CHARS = 20_000;
const MAX_MESSAGE_CHARS = 2000;

const JOB_SUGGESTIONS = [
  "How well do I fit this job?",
  "What interview questions should I prepare for?",
  "How can I tailor my resume for this job?",
];
const GENERAL_SUGGESTIONS = [
  "What should I add to my profile?",
  "How do I prepare for my first interview?",
  "Which skills should I learn next?",
];

/**
 * ประวัติแชตอยู่ที่เว็บเท่านั้น (API ไม่เก็บ) แต่ API รับได้ไม่เกิน 20 ข้อความ / 20,000 ตัวอักษร
 * ส่งเฉพาะข้อความล่าสุดที่ยังอยู่ในเพดาน — แชตยาวยังคุยต่อได้ แค่ Bot ลืมช่วงต้น
 */
export function recentHistory(entries: ChatEntry[]): AssistantMessage[] {
  const kept: AssistantMessage[] = [];
  let total = 0;
  for (let i = entries.length - 1; i >= 0 && kept.length < MAX_MESSAGES; i--) {
    total += entries[i].content.length;
    if (total > MAX_TOTAL_CHARS) break;
    kept.unshift({ role: entries[i].role, content: entries[i].content });
  }
  return kept;
}

/** หน้า /jobs/[id] = คุยเรื่องงานนั้น Bot จึงได้ context ของงานโดยไม่ต้องให้หน้าส่ง prop มา */
function jobIdFromPath(pathname: string | null): string | undefined {
  const match = pathname?.match(/^\/jobs\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function AssistantChat({
  jobId,
  onClose,
}: {
  jobId?: string;
  onClose?: () => void;
}) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [entries, isPending]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || isPending) return;
    const next: ChatEntry[] = [...entries, { role: "user", content }];
    setEntries(next);
    setDraft("");
    setError(null);
    startTransition(async () => {
      const result = await sendAssistantMessageAction(recentHistory(next), jobId);
      if (result.success) {
        setEntries([
          ...next,
          { role: "assistant", content: result.data.reply, source: result.data.source },
        ]);
      } else {
        // คืนข้อความให้แก้แล้วส่งใหม่ได้ ไม่ต้องพิมพ์ใหม่
        setEntries(entries);
        setDraft(content);
        setError(
          result.code === "ASSISTANT_INPUT_TOO_LARGE"
            ? "This chat is too long. Start a new chat to continue."
            : result.message,
        );
      }
    });
  };

  const suggestions = jobId ? JOB_SUGGESTIONS : GENERAL_SUGGESTIONS;

  return (
    <section
      aria-label="MATCHBACK Bot"
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg"
    >
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Bot aria-hidden="true" className="size-5 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">MATCHBACK Bot</h2>
          <p className="truncate text-xs text-muted-foreground">
            {jobId ? "Ask about this job and your fit" : "Ask about your job search"}
          </p>
        </div>
        {entries.length > 0 && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEntries([]);
              setError(null);
            }}
            aria-label="Start a new chat"
            disabled={isPending}
          >
            <RotateCcw />
          </Button>
        )}
        {onClose && (
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close chat">
            <X />
          </Button>
        )}
      </header>

      <div
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-busy={isPending}
      >
        {entries.length === 0 && (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Answers use only your profile{jobId ? " and this job" : ""}. The bot
              can&apos;t see what employers decided and never predicts hiring.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  className="h-auto py-1.5 whitespace-normal text-left"
                  onClick={() => send(suggestion)}
                  disabled={isPending}
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}

        {entries.map((entry, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-col gap-1",
              entry.role === "user" ? "items-end" : "items-start",
            )}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
                entry.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground",
              )}
            >
              <span className="sr-only">{entry.role === "user" ? "You: " : "Bot: "}</span>
              {entry.content}
            </p>
            {entry.source === "fallback" && (
              <Badge variant="outline">Rule-based answer (AI not available)</Badge>
            )}
          </div>
        ))}

        {isPending && (
          <p className="text-sm text-muted-foreground" role="status">
            Thinking...
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form
        className="space-y-2 border-t border-border p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
      >
        {error && <FormAlert message={error} />}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่ (ไม่ส่งระหว่างพิมพ์ภาษาไทยด้วย IME)
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                send(draft);
              }
            }}
            maxLength={MAX_MESSAGE_CHARS}
            rows={2}
            className="min-h-0 resize-none"
            placeholder="Ask a question..."
            aria-label="Message"
          />
          <Button type="submit" size="icon-lg" disabled={isPending || !draft.trim()} aria-label="Send">
            <Send />
          </Button>
        </div>
      </form>
    </section>
  );
}

/** ปุ่มลอยมุมขวาล่าง — mount ครั้งเดียวใน (app)/layout.tsx เฉพาะ role USER */
export default function AssistantLauncher() {
  const [open, setOpen] = useState(false);
  const jobId = jobIdFromPath(usePathname());

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="h-[min(560px,calc(100dvh-6rem))] w-[min(380px,calc(100vw-2rem))]">
          {/* key: เปลี่ยนงาน = เริ่มแชตใหม่ ไม่งั้น Bot ตอบเรื่องงานเก่าด้วย context ของงานใหม่ */}
          <AssistantChat key={jobId ?? "general"} jobId={jobId} onClose={() => setOpen(false)} />
        </div>
      )}
      <Button
        size="icon-lg"
        className="size-12 rounded-full shadow-lg"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Close MATCHBACK Bot" : "Open MATCHBACK Bot"}
      >
        {open ? <X /> : <MessageCircle />}
      </Button>
    </div>
  );
}
