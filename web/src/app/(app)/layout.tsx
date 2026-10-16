import AssistantLauncher from "@/components/features/assistant/AssistantChat";
import AppHeader from "@/components/layout/AppHeader";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * ทุกหน้าใน (app) ต้องล็อกอิน
 * เช็กใน layout = กันการ "เห็นหน้า" เท่านั้น ข้อมูลจริงยังผ่าน AuthGuard ของ API ทุกครั้ง
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <AppHeader name={session.user.name} role={session.user.role} />
      {/* MATCHBACK Bot เฉพาะผู้สมัคร (API ก็ตอบ 403 ให้ role อื่นอยู่แล้ว) */}
      <main className="min-w-0 px-5 py-6 sm:px-8 sm:py-8 xl:px-12 xl:py-10">
        <div className="mx-auto w-full max-w-[1440px]">{children}</div>
      </main>
      {session.user.role === "USER" && <AssistantLauncher />}
    </div>
  );
}
