"use client";

import { Button } from "@/components/ui/button";

/**
 * error ที่ไม่ได้จัดการในหน้าใต้ (app) เช่น API ล่ม — ให้ลองใหม่ได้โดยไม่ต้องรีเฟรชทั้งเว็บ
 * session หมดอายุไม่มาถึงที่นี่ (apiFetch redirect ไป /session-expired ก่อน)
 */
export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-2xl border border-dashed p-8 text-center">
      <p className="font-medium">Something went wrong loading this page.</p>
      <p className="text-sm text-muted-foreground">
        The server may be starting up or unavailable. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
