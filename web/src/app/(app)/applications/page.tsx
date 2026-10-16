import ApplicationCard from "@/components/features/applications/ApplicationCard";
import { ApplicationsApi } from "@/lib/api/applications.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Applications" };

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter/jobs");
  if (session.user.role === "ADMIN") redirect("/admin");

  const all = await ApplicationsApi.findAll(session.user.access_token);
  // INTERESTED อยู่หน้า Saved: หน้านี้คือสิ่งที่สมัครไปแล้วจริง
  const applications = all.filter((application) => application.status !== "INTERESTED");

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <p className="text-sm text-muted-foreground">
          Keep track of where you applied. You update the status yourself — MATCHBACK
          does not receive updates from employers.
        </p>
      </header>

      {applications.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nothing tracked yet. On the{" "}
          <Link href="/saved" className="font-medium underline">
            Saved
          </Link>{" "}
          page, press &ldquo;I applied&rdquo; after you send an application.
        </p>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <ApplicationCard key={application.id} application={application} />
          ))}
        </div>
      )}
    </div>
  );
}
