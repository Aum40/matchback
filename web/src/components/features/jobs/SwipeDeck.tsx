"use client";

import MatchModal from "@/components/features/match/MatchModal";
import { skillStates } from "@/components/features/jobs/SkillChips";
import SwipeStack from "@/components/features/swipe/SwipeStack";
import JobCard from "@/components/features/jobs/JobCard";
import { buttonVariants } from "@/components/ui/button";
import { resetSwipesAction, swipeAction } from "@/lib/actions/jobs.action";
import type { DiscoverJob, SwipeDirection, SwipeResult } from "@/lib/api/api.type";
import Link from "next/link";
import { useState } from "react";

export default function SwipeDeck({ jobs }: { jobs: DiscoverJob[] }) {
  const [createdMatch, setCreatedMatch] = useState<SwipeResult | null>(null);

  const handleSwipe = (job: DiscoverJob, direction: SwipeDirection) =>
    swipeAction(job.id, direction);

  const handleSwipeResult = (_job: DiscoverJob, result: SwipeResult) => {
    if (result.matchCreated && result.matchId) setCreatedMatch(result);
  };

  return (
    <>
      <SwipeStack
        items={jobs}
        getKey={(job) => job.id}
        onSwipe={handleSwipe}
        onSwipeResult={handleSwipeResult}
        itemLabel="job"
        ariaLabel="Job cards. Use the left and right arrow keys to pass or like."
        emptyState={
          <>
            <p className="font-medium text-navy">You&apos;ve seen every job for now.</p>
            <p className="text-sm text-muted-foreground">
              Review your saved jobs, or start over to see skipped jobs again.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/saved" className={buttonVariants()}>
                View saved jobs
              </Link>
              <form action={resetSwipesAction}>
                <button type="submit" className={buttonVariants({ variant: "outline" })}>
                  Start over
                </button>
              </form>
            </div>
          </>
        }
        renderCard={(job) => (
          <JobCard job={job} score={job.match.score} skillStates={skillStates(job.match)}>
            <Link
              href={`/jobs/${job.id}`}
              className="text-sm font-semibold text-brand underline underline-offset-4"
            >
              See details and fit analysis
            </Link>
          </JobCard>
        )}
      />

      <MatchModal
        open={createdMatch !== null}
        matchId={createdMatch?.matchId ?? null}
        title="A strong next step"
        subtitle="This job is now a confirmed mutual match. Open the match to review the role and contact details."
        primaryHref={createdMatch?.matchId ? `/matches/${createdMatch.matchId}` : "/matches"}
        onClose={() => setCreatedMatch(null)}
      />
    </>
  );
}
