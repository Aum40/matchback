import { ErrorActionResult } from "@/lib/actions/action.type";
import { ApiError } from "@/lib/api/api-error";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/** access token ของคนที่ล็อกอินอยู่ ไม่มี session = พาไปหน้า login (หยุด action ตรงนี้) */
export async function requireToken(): Promise<string> {
  const session = await auth();
  if (!session) redirect("/login");
  return session.user.access_token;
}

/**
 * แปลง error ที่คาดไว้ได้ (ApiError) เป็นผลลัพธ์ให้ฟอร์มแสดง
 * error อื่น (รวม redirect ของ apiFetch ตอน session หมด) โยนต่อเสมอ ห้ามกลืน
 */
export function toActionError(error: unknown): ErrorActionResult {
  if (error instanceof ApiError) {
    return {
      success: false,
      message: error.message,
      code: error.code ?? "API_ERROR",
    };
  }
  throw error;
}
