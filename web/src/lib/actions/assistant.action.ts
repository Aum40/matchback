"use server";

import { requireToken, toActionError } from "@/lib/actions/action-helpers";
import { ErrorActionResult } from "@/lib/actions/action.type";
import type { AssistantMessage, AssistantResponse } from "@/lib/api/api.type";
import { AssistantApi } from "@/lib/api/assistant.api";
import z from "zod";

// กฎเดียวกับ API (SendMessagesDto + ASSISTANT_INPUT_TOO_LARGE) — ตัดตั้งแต่ฝั่งเว็บไม่ต้องเสีย request
const messagesSchema = z
  .array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string().trim().min(1).max(2000),
    }),
  )
  .min(1)
  .max(20)
  .refine((messages) => messages.reduce((n, m) => n + m.content.length, 0) <= 20_000)
  .refine((messages) => messages[messages.length - 1]?.role === "user");

export async function sendAssistantMessageAction(
  messages: AssistantMessage[],
  jobId?: string,
): Promise<{ success: true; data: AssistantResponse } | ErrorActionResult> {
  const parsed = z
    .object({ messages: messagesSchema, jobId: z.string().trim().min(1).max(100).optional() })
    .safeParse({ messages, jobId });
  if (!parsed.success) {
    return {
      success: false,
      message: "This message can't be sent. Keep it under 2,000 characters, or start a new chat.",
      code: "VALIDATION_ERROR",
    };
  }

  const token = await requireToken();
  try {
    return {
      success: true,
      data: await AssistantApi.send(parsed.data.messages, parsed.data.jobId, token),
    };
  } catch (error) {
    return toActionError(error);
  }
}
