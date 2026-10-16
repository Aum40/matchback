import SwipeDeck from "@/components/features/jobs/SwipeDeck";
import FitInsightPanel from "@/components/features/jobs/FitInsightPanel";
import { CandidatesApi } from "@/lib/api/candidates.api";
import { JobsApi } from "@/lib/api/jobs.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Discover jobs" };

export default async function DiscoverPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter");
  if (session.user.role === "ADMIN") redirect("/admin");

  const user = session.user as { role?: string; access_token: string };

  // 💡 ป้องกันไม่ให้บทบาท RECRUITER รันไปยิง API ฝั่ง Candidate ด้านล่าง
  // หากเป็น RECRUITER ให้เปลี่ยนเส้นทางไปหน้าจัดการงานทันที
  if (user.role === "RECRUITER") {
    redirect("/recruiter/jobs");
  }

  const token = user.access_token;
  const [jobs, profile] = await Promise.all([
    JobsApi.discover(token),
    CandidatesApi.getProfile(token),
  ]);

  return (
    <div className="space-y-8">
      <header className="border-b border-border/80 pb-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">Candidate workspace</p>
        <h1 className="mt-2 text-4xl font-bold tracking-[-0.05em] text-navy sm:text-5xl">Discover jobs</h1>
        <p className="mt-3 max-w-xl text-base text-muted-foreground">
          Find work that fits your skills and see the evidence behind the score.
        </p>
      </header>

      {!profile.isComplete && (
        <p className="rounded-xl bg-warning/15 p-3 text-sm">
          Your match scores are rough until you{" "}
          <Link href="/profile" className="font-medium underline">
            complete your profile
          </Link>{" "}
          with your skills.
        </p>
      )}

      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="mx-auto w-full max-w-2xl">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-navy">Your next opportunity</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Swipe, use the buttons, or press the arrow keys.
              </p>
            </div>
            <span className="hidden rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground sm:inline-flex">
              {jobs.length} {jobs.length === 1 ? "job" : "jobs"} left
            </span>
          </div>

          {/* key: หลังรีเซ็ตหรือแก้โปรไฟล์ ข้อมูลใหม่จาก server ต้องเริ่มกองการ์ดใหม่ */}
          <SwipeDeck key={jobs.map((job) => job.id).join()} jobs={jobs} />
        </section>
        <FitInsightPanel job={jobs[0]} />
      </div>
    </div>
  );
}