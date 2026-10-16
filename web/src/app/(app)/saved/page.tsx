import ApplicationCard from "@/components/features/applications/ApplicationCard";
import { buttonVariants } from "@/components/ui/button";
import { ApplicationsApi } from "@/lib/api/applications.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Saved jobs" };

/** งานที่ปัดขวาแล้ว ยังไม่ได้สมัคร (สถานะ INTERESTED) */
export default async function SavedPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter/jobs");
  if (session.user.role === "ADMIN") redirect("/admin");

  const saved = await ApplicationsApi.findAll(session.user.access_token, "INTERESTED");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Saved jobs</h1>
        <p className="text-sm text-muted-foreground">
          Jobs you swiped right on. When you apply, mark it here to start tracking.
        </p>
      </header>

      {saved.length === 0 ? (
        <div className="space-y-4 rounded-2xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">No saved jobs yet.</p>
          <Link href="/discover" className={buttonVariants()}>
            Discover jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {saved.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              showTracking={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
