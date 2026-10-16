import JobCard from "@/components/features/jobs/JobCard";
import type { SkillState } from "@/components/features/jobs/SkillChips";
import MatchAnalysis from "@/components/features/match/MatchAnalysis";
import { ExplainMatchPanel, ResumeCoachPanel } from "@/components/features/match/AiPanels";
import { ApiError } from "@/lib/api/api-error";
import type { MatchResult } from "@/lib/api/api.type";
import { JobsApi } from "@/lib/api/jobs.api";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

export const metadata: Metadata = { title: "Job details" };

function statesFrom(match: MatchResult): Record<string, SkillState> {
  return Object.fromEntries([
    ...match.matchedSkills.map((skill) => [skill.id, "matched"] as const),
    ...match.unconfirmedSkills.map((skill) => [skill.id, "unconfirmed"] as const),
    ...match.missingSkills.map((skill) => [skill.id, "missing"] as const),
  ]);
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const { id } = await params;

  let data;
  try {
    data = await JobsApi.getMatch(id, session.user.access_token);
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) notFound();
    throw error;
  }
  const { job, match } = data;

  return (
    <div className="grid gap-6">
      <Link href="/discover" className="text-sm text-muted-foreground hover:underline">
        ← Back to Discover
      </Link>

      <JobCard job={job} score={match.score} skillStates={statesFrom(match)} skillLimit={20}>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">About the job</h2>
          <p className="text-sm whitespace-pre-line text-muted-foreground">
            {job.description}
          </p>
        </section>
      </JobCard>

      <MatchAnalysis match={match} />
      <ExplainMatchPanel jobId={job.id} />
      <ResumeCoachPanel jobId={job.id} />
    </div>
  );
}
