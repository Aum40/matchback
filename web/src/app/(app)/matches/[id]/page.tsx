import { ApiError } from "@/lib/api/api-error";
import { MatchesApi } from "@/lib/api/matches.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Match details" };

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "RECRUITER") redirect("/recruiter/jobs");
  if (session.user.role === "ADMIN") redirect("/admin");

  const { id } = await params;
  let match;
  try {
    match = await MatchesApi.findOne(id, session.user.access_token);
  } catch (error) {
    if (error instanceof ApiError && (error.code === "MATCH_NOT_FOUND" || error.statusCode === 404)) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link href="/matches" className="text-sm font-semibold text-brand hover:underline">
        Back to Matches
      </Link>

      <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-navy/10">
        <div
          aria-hidden="true"
          className="relative h-36 overflow-hidden bg-brand-soft"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, var(--highlight), transparent 32%), radial-gradient(circle at 82% 8%, color-mix(in oklch, var(--brand) 45%, transparent), transparent 44%), linear-gradient(135deg, var(--brand-soft), var(--background))",
          }}
        />
        <div className="space-y-6 p-6 sm:p-8">
          <header>
            <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand">Mutual match confirmed</span>
            <h1 className="mt-5 text-3xl font-bold tracking-[-0.04em] text-navy">{match.job.title}</h1>
            <p className="mt-2 font-medium text-muted-foreground">{match.job.company}</p>
          </header>

          <p className="leading-7 text-muted-foreground">{match.job.description}</p>

          <div className="grid gap-4 rounded-2xl bg-brand-soft p-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Candidate</p>
              <p className="mt-2 font-semibold text-navy">{match.candidate.name}</p>
              {match.candidate.headline && <p className="mt-1 text-sm text-muted-foreground">{match.candidate.headline}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Contact</p>
              <a href={`mailto:${match.candidate.email}`} className="mt-2 block font-semibold text-navy underline underline-offset-4">
                {match.candidate.email}
              </a>
            </div>
          </div>

          <Link href="/discover" className="inline-flex text-sm font-semibold text-brand hover:underline">
            Continue discovering jobs
          </Link>
        </div>
      </article>
    </div>
  );
}
