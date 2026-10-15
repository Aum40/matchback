"use client";

import FormAlert from "@/components/features/auth/FormAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { coachResumeAction, explainMatchAction } from "@/lib/actions/jobs.action";
import type { MatchExplanation, ResumeCoaching } from "@/lib/api/api.type";
import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

/** บอกเสมอว่าข้อความมาจากไหน: AI ต้องให้ผู้ใช้ตรวจเอง, fallback คือกฎตายตัว */
function SourceNote({ source }: { source: "ai" | "fallback" }) {
  return source === "ai" ? (
    <Badge variant="secondary">
      <Sparkles aria-hidden="true" /> AI-generated — check it against your real experience
    </Badge>
  ) : (
    <Badge variant="outline">Rule-based suggestions (AI not available)</Badge>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-1.5">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="list-disc space-y-1 pl-5 text-sm">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

/**
 * เรียก AI เฉพาะตอนกดปุ่ม ไม่เรียกตอนโหลดหน้า: แต่ละครั้งเสียเงินและใช้เวลาหลายวินาที
 * (ผลจับคู่หลักแสดงจาก API แบบ deterministic อยู่แล้ว)
 */
function useAiRequest<T>(
  request: () => Promise<{ success: true; data: T } | { success: false; message: string }>,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      setError(null);
      const result = await request();
      if (result.success) setData(result.data);
      else setError(result.message);
    });

  return { data, error, isPending, run };
}

export function ExplainMatchPanel({ jobId }: { jobId: string }) {
  const { data, error, isPending, run } = useAiRequest<MatchExplanation>(() =>
    explainMatchAction(jobId),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Explain this match</CardTitle>
        <CardDescription>
          A plain-language explanation of your score and what to do next.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4" aria-live="polite" aria-busy={isPending}>
        {error && <FormAlert message={error} />}
        {data ? (
          <>
            <SourceNote source={data.source} />
            <p className="text-sm">{data.summary}</p>
            <BulletList title="Strengths" items={data.strengths} />
            <BulletList title="Gaps and missing information" items={data.gaps} />
            <BulletList title="Suggested next steps" items={data.nextSteps} />
          </>
        ) : (
          <Button onClick={run} disabled={isPending} className="justify-self-start">
            <Sparkles aria-hidden="true" />
            {isPending ? "Explaining..." : "Explain my match"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ResumeCoachPanel({ jobId }: { jobId: string }) {
  const { data, error, isPending, run } = useAiRequest<ResumeCoaching>(() =>
    coachResumeAction(jobId),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume coach</CardTitle>
        <CardDescription>
          Suggestions to tailor your resume for this job, based only on what is
          in your profile.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4" aria-live="polite" aria-busy={isPending}>
        {error && <FormAlert message={error} />}
        {data ? (
          <>
            <SourceNote source={data.source} />
            <BulletList title="Emphasize" items={data.emphasize} />
            <BulletList title="Experience and projects to highlight" items={data.highlight} />
            {data.bulletSuggestions.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Stronger resume bullets</h3>
                <ul className="space-y-3">
                  {data.bulletSuggestions.map((bullet) => (
                    <li key={bullet.suggestion} className="rounded-xl border p-3 text-sm">
                      {bullet.original && (
                        <p className="text-muted-foreground line-through decoration-muted-foreground/50">
                          {bullet.original}
                        </p>
                      )}
                      <p className="font-medium">{bullet.suggestion}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{bullet.reason}</p>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <BulletList title="Be careful" items={data.cautions} />
          </>
        ) : (
          <Button
            variant="outline"
            onClick={run}
            disabled={isPending}
            className="justify-self-start"
          >
            <Sparkles aria-hidden="true" />
            {isPending ? "Reviewing your profile..." : "Get resume suggestions"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
