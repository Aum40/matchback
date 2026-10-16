"use server";

import { ErrorActionResult } from "@/lib/actions/action.type";
import { auth, signIn, signOut } from "@/lib/auth";
import { loginErrorMessage } from "@/lib/login-errors";
import {
  LoginInput,
  RegisterInput,
  registerSchema,
} from "@/lib/schemas/auth.schema";
import { revokeCurrentSession } from "@/lib/session-token";
import { CredentialsSignin } from "next-auth";
import { redirect } from "next/navigation";
import z from "zod";

/** แยกการ Redirect ออกมาให้จัดการแยกกันตาม Role */
async function signInWithCredentials(
  fields: Record<string, string>,
): Promise<ErrorActionResult | void> {
  try {
    // กำหนด redirect: false เพื่อให้เราเขียนเงื่อนไขตรวจสอบเองทีหลัง
    await signIn("credentials", { ...fields, redirect: false });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      const code = error.code ?? "INVALID_CREDENTIALS";
      return { success: false, message: loginErrorMessage(code), code };
    }
    throw error;
  }
}

export async function loginAction(
  input: LoginInput,
): Promise<ErrorActionResult | void> {
  const err = await signInWithCredentials(input as unknown as Record<string, string>);
  if (err) return err;

  // ล็อกอินเสร็จ เช็กจาก Session ว่าเป็นใคร
  const session = await auth();
  const role = session?.user?.role || (session?.user as (NonNullable<typeof session>["user"] & { accountType?: string }) | undefined)?.accountType;
  
  if (role === "RECRUITER") {
    redirect("/recruiter/jobs");
  }
  redirect("/discover");
}

export async function registerAction(
  input: RegisterInput,
): Promise<ErrorActionResult | void> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: loginErrorMessage("VALIDATION_ERROR"),
      errors: z.flattenError(parsed.error),
      code: "VALIDATION_ERROR",
    };
  }

  const err = await signInWithCredentials({ ...parsed.data, intent: "register" } as unknown as Record<string, string>);
  if (err) return err;

  // สมัครเสร็จ เราดูจากข้อมูลที่กรอกได้เลยว่าเลือก Role อะไร
  if (parsed.data.accountType === "RECRUITER") {
    redirect("/recruiter/jobs");
  }
  redirect("/discover");
}

export async function loginWithGoogleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/discover" });
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  await signOut({ redirectTo: "/" });
}
