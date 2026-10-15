"use server";

import { requireToken, toActionError } from "@/lib/actions/action-helpers";
import { ErrorActionResult } from "@/lib/actions/action.type";
import { CandidatesApi } from "@/lib/api/candidates.api";
import { ProfileInput, profileInputSchema } from "@/lib/schemas/profile.schema";
import { revalidatePath } from "next/cache";
import z from "zod";

export async function updateProfileAction(
  input: ProfileInput,
): Promise<{ success: true } | ErrorActionResult> {
  const parsed = profileInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the form and try again.",
      errors: z.flattenError(parsed.error),
      code: "VALIDATION_ERROR",
    };
  }

  const token = await requireToken();
  try {
    await CandidatesApi.updateProfile(parsed.data, token);
  } catch (error) {
    return toActionError(error);
  }

  // คะแนนทุกงานขึ้นกับโปรไฟล์ หน้าที่แสดงคะแนนต้องคำนวณใหม่
  revalidatePath("/profile");
  revalidatePath("/discover");
  revalidatePath("/jobs/[id]", "page");
  return { success: true };
}
