"use server";

import { ErrorActionResult } from "@/lib/actions/action.type";
import { auth, signIn, signOut } from "@/lib/auth";
import { env } from "@/lib/env";
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

const demoRoleSchema = z.enum(["candidate", "recruiter"]);

/** ล็อกอินและสมัครจบเหมือนกัน: ผ่านแล้วไปหน้า Discover ไม่ผ่านคืน code ให้ฟอร์มแสดง */
async function signInWithCredentials(
  fields: Record<string, string>,
  redirectTo = "/discover",
): Promise<ErrorActionResult | void> {
  try {
    await signIn("credentials", { ...fields, redirect: false });
  } catch (error) {
    if (error instanceof CredentialsSignin) {
      const code = error.code ?? "INVALID_CREDENTIALS";
      return { success: false, message: loginErrorMessage(code), code };
    }
    throw error;
  }

  redirect(redirectTo);
}

export async function loginAction(
  input: LoginInput,
): Promise<ErrorActionResult | void> {
  const err = await signInWithCredentials(input, "/discover");
  if (err) return err;

  const session = await auth();
  const role = session?.user?.role || (session?.user as { accountType?: string } | undefined)?.accountType;
  redirect(role === "RECRUITER" ? "/recruiter/jobs" : "/discover");
}

export async function registerAction(
  input: RegisterInput,
): Promise<ErrorActionResult | void> {
  // ตรวจซ้ำฝั่ง server เสมอ ค่าที่มาจาก browser แก้ได้ทุกอย่าง
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: loginErrorMessage("VALIDATION_ERROR"),
      errors: z.flattenError(parsed.error),
      code: "VALIDATION_ERROR",
    };
  }

  return signInWithCredentials(
    { ...parsed.data, intent: "register" },
    parsed.data.accountType === "RECRUITER" ? "/recruiter/jobs" : "/discover",
  );
}

export async function loginWithGoogleAction(): Promise<void> {
  await signIn("google", { redirectTo: "/discover" });
}

export async function demoLoginAction(
  role: "candidate" | "recruiter",
): Promise<ErrorActionResult | void> {
  const parsedRole = demoRoleSchema.safeParse(role);
  if (!parsedRole.success) {
    return {
      success: false,
      message: "Invalid demo account.",
      code: "VALIDATION_ERROR",
    };
  }

  const credentials =
    parsedRole.data === "candidate"
      ? { email: env.DEMO_CANDIDATE_EMAIL, password: env.DEMO_CANDIDATE_PASSWORD }
      : { email: env.DEMO_RECRUITER_EMAIL, password: env.DEMO_RECRUITER_PASSWORD };

  if (!credentials.email || !credentials.password) {
    return {
      success: false,
      message: "This demo account is not configured.",
      code: "DEMO_NOT_CONFIGURED",
    };
  }

  return signInWithCredentials(
    { email: credentials.email, password: credentials.password },
    parsedRole.data === "recruiter" ? "/recruiter/jobs" : "/discover",
  );
}

export async function logoutAction(): Promise<void> {
  await revokeCurrentSession();
  await signOut({ redirectTo: "/" });
}
