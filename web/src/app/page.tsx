import JobCard from "@/components/features/jobs/JobCard";
import { buttonVariants } from "@/components/ui/button";
import type { Job } from "@/lib/api/api.type";
import { JobsApi } from "@/lib/api/jobs.api";
import { auth } from "@/lib/auth";
import { HelpCircle, ListChecks, Sparkles } from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: ListChecks,
    title: "See why a job fits",
    text: "Every job gets a 0–100 match score from your skills and preferences, with matching skills and real gaps listed separately.",
  },
  {
    icon: HelpCircle,
    title: "Missing info is not a gap",
    text: "If your profile just doesn't say, we tell you what to clarify instead of counting it against you.",
  },
  {
    icon: Sparkles,
    title: "Better applications",
    text: "Get suggestions to tailor your resume using only what you have actually done.",
  },
];

/** ตัวอย่างงานบนหน้าแรก — API ล่มก็ยังเปิดหน้าแรกได้ แค่ไม่มีส่วนนี้ */
async function loadSampleJobs(): Promise<Job[] | null> {
  try {
    return (await JobsApi.findAll()).slice(0, 3);
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [session, jobs] = await Promise.all([auth(), loadSampleJobs()]);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-12 px-4 py-12 sm:py-20">
      <section className="space-y-6 text-center">
        <p className="text-sm font-semibold tracking-widest text-muted-foreground">
          MATCHBACK
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Swipe smart. Apply with confidence.
        </h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          Discover jobs by swiping, understand how well each one fits your
          skills, and improve your application before you send it. Better
          applications — not just more of them.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {session ? (
            <Link href="/discover" className={buttonVariants({ size: "lg" })}>
              Start discovering
            </Link>
          ) : (
            <>
              <Link href="/signup" className={buttonVariants({ size: "lg" })}>
                Get started
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="Features">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="space-y-2 rounded-2xl border p-5">
            <Icon className="size-5" aria-hidden="true" />
            <h2 className="font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{text}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4" aria-labelledby="sample-jobs">
        <h2 id="sample-jobs" className="text-xl font-semibold">
          Sample jobs
        </h2>
        {jobs === null ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            We couldn&apos;t load jobs right now. Is the API running?
          </p>
        ) : jobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            No jobs yet. Run <code>pnpm db:seed</code> in <code>api/</code> to
            add demo jobs.
          </p>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} skillLimit={4} />
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          All jobs and companies shown are demo data. Match scores describe how
          well a profile fits a job; they don&apos;t predict whether an employer
          will respond.
        </p>
      </section>
    </main>
  );
}
