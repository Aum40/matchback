"use client";

import MatchModal from "@/components/features/match/MatchModal";
import SwipeStack from "@/components/features/swipe/SwipeStack";
import { recruiterSwipeAction } from "@/lib/actions/recruiter.action";
import type { CandidateCard } from "@/lib/api/api.type";
import {
  Award,
  BriefcaseBusiness,
  GraduationCap,
  Heart,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

export default function CandidateDeck({
  jobId,
  candidates,
}: {
  jobId: string;
  candidates: CandidateCard[];
}) {
  const [match, setMatch] = useState<{
    id: string;
    candidateName: string;
  } | null>(null);

  return (
    <>
      <SwipeStack
        items={candidates}
        getKey={(candidate) => candidate.candidateId}
        onSwipe={(candidate, direction) =>
          recruiterSwipeAction(jobId, candidate.candidateId, direction)
        }
        onSwipeResult={(candidate, result) => {
          if (result.matchCreated && result.matchId) {
            setMatch({ id: result.matchId, candidateName: candidate.displayName });
          }
        }}
        ariaLabel="Candidate review deck"
        itemLabel="candidate"
        emptyState={
          <div className="mx-auto max-w-md">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand-soft text-brand">
              <Heart aria-hidden="true" className="size-7" />
            </div>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-navy">
              You&apos;re all caught up
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              New candidate profiles will appear here when they are available
              for this role.
            </p>
          </div>
        }
        renderCard={(candidate) => <CandidateCardView candidate={candidate} />}
      />

      <MatchModal
        open={Boolean(match)}
        matchId={match?.id ?? null}
        title={`You matched with ${match?.candidateName ?? "a candidate"}`}
        subtitle="This candidate and your company both chose Like. Keep the momentum going from your recruiter workspace."
        primaryHref="/jobs"
        onClose={() => setMatch(null)}
      />
    </>
  );
}

function CandidateCardView({ candidate }: { candidate: CandidateCard }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-xl shadow-navy/10">
      <div
        aria-hidden="true"
        className="relative h-32 overflow-hidden bg-brand-soft"
        style={{
          background:
            "radial-gradient(circle at 16% 20%, var(--highlight), transparent 28%), radial-gradient(circle at 84% 10%, color-mix(in oklch, var(--brand) 55%, transparent), transparent 44%), linear-gradient(135deg, var(--brand-soft), var(--background))",
        }}
      >
        <div className="absolute -bottom-12 -right-6 size-36 rounded-full border-[18px] border-background/25" />
        <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full border border-background/60 bg-background/75 px-3 py-1.5 text-xs font-semibold text-navy backdrop-blur-sm">
          <Sparkles aria-hidden="true" className="size-3.5 text-brand" />
          Candidate profile
        </div>
      </div>

      <div className="space-y-6 p-5 sm:p-7">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-navy text-lg font-semibold text-background">
              {candidate.displayName.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-[-0.04em] text-navy">
                {candidate.displayName}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {candidate.headline || "Open to a meaningful next move"}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl bg-brand-soft px-3 py-2 text-center text-brand">
            <p className="text-2xl font-semibold leading-none">{candidate.match.score}%</p>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]">
              Fit
            </p>
          </div>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoBlock
            icon={GraduationCap}
            label="Education"
            value={candidate.education || "Not provided"}
          />
          <InfoBlock
            icon={BriefcaseBusiness}
            label="Experience"
            value={candidate.experience || "Not provided"}
          />
        </div>

        {candidate.projects && (
          <div className="rounded-2xl bg-muted/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
              <Award aria-hidden="true" className="size-4" />
              Projects
            </div>
            <p className="mt-2 line-clamp-4 text-sm leading-6 text-muted-foreground">
              {candidate.projects}
            </p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-navy">Relevant skills</p>
            <p className="text-xs text-muted-foreground">
              {candidate.skills.length} listed
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {candidate.skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full border border-brand/20 bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand"
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}

function InfoBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof GraduationCap;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-brand">
        <Icon aria-hidden="true" className="size-4" />
        {label}
      </div>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}
