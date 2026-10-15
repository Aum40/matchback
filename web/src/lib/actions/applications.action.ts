"use server";

import { requireToken, toActionError } from "@/lib/actions/action-helpers";
import { ErrorActionResult } from "@/lib/actions/action.type";
import { ApplicationsApi } from "@/lib/api/applications.api";
import {
  ApplicationUpdateInput,
  applicationUpdateSchema,
} from "@/lib/schemas/application.schema";
import { revalidatePath } from "next/cache";
import z from "zod";

// 💡 เปลี่ยนจาก z.uuid() เป็น z.string().trim().min(1)
const idSchema = z.string().trim().min(1);

function revalidateLists() {
  revalidatePath("/saved");
  revalidatePath("/applications");
}

export async function updateApplicationAction(
  id: string,
  input: ApplicationUpdateInput,
): Promise<{ success: true } | ErrorActionResult> {
  const parsed = z
    .object({ id: idSchema, input: applicationUpdateSchema })
    .safeParse({ id, input });
  if (!parsed.success) {
    return {
      success: false,
      message: "Please check the form and try again.",
      code: "VALIDATION_ERROR",
    };
  }

  const token = await requireToken();
  try {
    await ApplicationsApi.update(parsed.data.id, parsed.data.input, token);
  } catch (error) {
    return toActionError(error);
  }
  revalidateLists();
  return { success: true };
}

export async function removeApplicationAction(
  id: string,
): Promise<{ success: true } | ErrorActionResult> {
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) {
    return { success: false, message: "Invalid item", code: "VALIDATION_ERROR" };
  }

  const token = await requireToken();
  try {
    await ApplicationsApi.remove(parsed.data, token);
  } catch (error) {
    return toActionError(error);
  }
  revalidateLists();
  return { success: true };
}