"use server";

import { requireToken, toActionError } from "@/lib/actions/action-helpers";
import { ErrorActionResult } from "@/lib/actions/action.type";
import type {
  MatchExplanation,
  ResumeCoaching,
  SwipeDirection,
} from "@/lib/api/api.type";
import { JobsApi } from "@/lib/api/jobs.api";
import { apiFetch } from "@/lib/api/api-fetch";
import { revalidatePath } from "next/cache";
import z from "zod";

const jobIdSchema = z.string().trim().min(1).max(100);

/** ดึงรายละเอียดงานตาม ID (สำหรับ Candidate ดูข้อมูลงาน) */
export async function getJobDetailAction(
  jobId: string
): Promise<{ success: true; data: any } | ErrorActionResult> {
  const parsed = jobIdSchema.safeParse(jobId);
  if (!parsed.success) {
    return { success: false, message: "Invalid job ID", code: "VALIDATION_ERROR" };
  }

  const token = await requireToken();
  try {
    const data = await apiFetch<any>(`/jobs/${parsed.data}`, { token });
    return { success: true, data };
  } catch (error) {
    return toActionError(error);
  }
}

export async function swipeAction(
  jobId: string,
  direction: SwipeDirection
): Promise<{ success: true } | ErrorActionResult> {
  const parsed = z
    .object({ jobId: jobIdSchema, direction: z.enum(["LIKE", "SKIP"]) })
    .safeParse({ jobId, direction });
  if (!parsed.success) {
    return { success: false, message: "Invalid swipe", code: "VALIDATION_ERROR" };
  }

  const token = await requireToken();
  try {
    await JobsApi.swipe(parsed.data.jobId, parsed.data.direction, token);
  } catch (error) {
    return toActionError(error);
  }
  revalidatePath("/saved");
  revalidatePath("/applications");
  return { success: true };
}

export async function resetSwipesAction(): Promise<void> {
  const token = await requireToken();
  await JobsApi.resetSwipes(token);
  revalidatePath("/discover");
}

export async function explainMatchAction(
  jobId: string
): Promise<{ success: true; data: MatchExplanation } | ErrorActionResult> {
  const parsed = jobIdSchema.safeParse(jobId);
  if (!parsed.success) {
    return { success: false, message: "Invalid job", code: "VALIDATION_ERROR" };
  }

  const token = await requireToken();
  try {
    return { success: true, data: await JobsApi.explainMatch(parsed.data, token) };
  } catch (error) {
    return toActionError(error);
  }
}

export async function coachResumeAction(
  jobId: string
): Promise<{ success: true; data: ResumeCoaching } | ErrorActionResult> {
  const parsed = jobIdSchema.safeParse(jobId);
  if (!parsed.success) {
    return { success: false, message: "Invalid job", code: "VALIDATION_ERROR" };
  }

  const token = await requireToken();
  try {
    return { success: true, data: await JobsApi.coachResume(parsed.data, token) };
  } catch (error) {
    return toActionError(error);
  }
}