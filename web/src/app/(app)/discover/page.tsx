import SwipeDeck from "@/components/features/jobs/SwipeDeck";
import { CandidatesApi } from "@/lib/api/candidates.api";
import { JobsApi } from "@/lib/api/jobs.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const token = session.user.access_token;
  const [jobs, profile] = await Promise.all([
    JobsApi.discover(token),
    CandidatesApi.getProfile(token),
  ]);

  return (
    <div className="mx-auto max-w-md space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Discover jobs</h1>
        <p className="text-sm text-muted-foreground">
          Best matches first. Swipe right to save, left to skip.
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

      {/* key: หลังรีเซ็ตหรือแก้โปรไฟล์ ข้อมูลใหม่จาก server ต้องเริ่มกองการ์ดใหม่ */}
      <SwipeDeck key={jobs.map((job) => job.id).join()} jobs={jobs} />
    </div>
  );
}
