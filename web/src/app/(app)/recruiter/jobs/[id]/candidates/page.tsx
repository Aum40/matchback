"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getCandidateDeckAction,
  swipeCandidateAction,
} from "@/lib/actions/recruiter.action";

interface CandidateCard {
  id?: string;
  userId?: string;
  user?: { id?: string; firstName?: string; lastName?: string; user_id?: string };
  firstName?: string;
  headline?: string | null;
  bio?: string;
  candidateId?: string;
  candidate_id?: string;
  user_id?: string;
  skills?: (string | { id?: string; name?: string; skillId?: string; skill?: { name?: string } })[];
  matchScore?: number;
}

export default function CandidateDeckPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: jobId } = use(params);
  const [candidates, setCandidates] = useState<CandidateCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [swiping, setSwiping] = useState(false);
  const [lastMatch, setLastMatch] = useState<boolean | null>(null);

  useEffect(() => {
    async function loadDeck() {
      setLoading(true);
      const res = await getCandidateDeckAction(jobId);
      if (res.data) {
        setCandidates(res.data);
      } else if (res.error) {
        setError(res.error);
      }
      setLoading(false);
    }
    loadDeck();
  }, [jobId]);

  const handleSwipe = async (direction: "LIKE" | "SKIP") => {
    const currentCandidate = candidates[currentIndex];
    if (!currentCandidate || swiping) return;

    // 🔍 ปริ้นท์ดู Object จริงที่ Backend ส่งมาใน F12 Console
    console.log("Current Candidate Data:", currentCandidate);

    // 💡 ดึง Candidate ID โดยครอบคลุมชื่อฟิลด์ทุกรูปแบบ (id, userId, user_id, candidateId, user_id)
    const candidateId =
      currentCandidate.id ??
      currentCandidate.userId ??
      currentCandidate.user_id ??
      currentCandidate.candidateId ??
      currentCandidate.candidate_id ??
      currentCandidate.user?.id ??
      currentCandidate.user?.user_id;

    if (!candidateId) {
      console.error("Candidate Object missing ID field:", currentCandidate);
      alert("Candidate ID is missing or invalid UUID format. Please check Console (F12)");
      return;
    }

    setSwiping(true);
    setLastMatch(null);

    const res = await swipeCandidateAction(jobId, candidateId, direction);
    if (res.data?.matched) {
      setLastMatch(true);
    } else if (res.error) {
      alert(res.error);
    }
    setCurrentIndex((prev) => prev + 1);
    setSwiping(false);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading candidate deck...</p>
      </div>
    );
  }

  const currentCandidate = candidates[currentIndex];
  const candidateName =
    currentCandidate?.firstName ??
    currentCandidate?.user?.firstName ??
    "Candidate";

  return (
    <div className="mx-auto max-w-xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/recruiter/jobs"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          ← Back to Jobs
        </Link>
        <span className="text-sm font-medium text-muted-foreground">
          Candidate Deck
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {lastMatch && (
        <div className="mb-4 animate-bounce rounded-md bg-emerald-500/15 p-4 text-center font-bold text-emerald-600 dark:text-emerald-400">
          🎉 IT&apos;S A MATCH! Candidate interested in your job!
        </div>
      )}

      {!currentCandidate ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <h3 className="text-lg font-semibold">No more candidates</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            You&apos;ve reviewed all candidates for this job posting.
          </p>
          <Link
            href="/recruiter/jobs"
            className={buttonVariants({ className: "mt-4" })}
          >
            Return to Job Postings
          </Link>
        </div>
      ) : (
        <div className="space-y-6 rounded-2xl border bg-card p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{candidateName}</h2>
              <p className="text-muted-foreground">
                {currentCandidate.headline || "Candidate"}
              </p>
            </div>
            {currentCandidate.matchScore !== undefined && (
              <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                {currentCandidate.matchScore}% Match
              </div>
            )}
          </div>

          {currentCandidate.bio && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                About
              </h4>
              <p className="text-sm leading-relaxed">{currentCandidate.bio}</p>
            </div>
          )}

          {currentCandidate.skills && currentCandidate.skills.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {currentCandidate.skills.map((skill, index) => {
                  const skillName =
                    typeof skill === "string"
                      ? skill
                      : (skill.name ?? skill.skill?.name ?? "Skill");
                  const skillKey =
                    typeof skill === "string"
                      ? skill
                      : (skill.id ?? skill.skillId ?? index);

                  return (
                    <span
                      key={skillKey}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium"
                    >
                      {skillName}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <Button
              variant="outline"
              size="lg"
              disabled={swiping}
              onClick={() => handleSwipe("SKIP")}
              className="text-destructive hover:bg-destructive/10"
            >
              ✕ Skip
            </Button>
            <Button
              size="lg"
              disabled={swiping}
              onClick={() => handleSwipe("LIKE")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ♥ Interested
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
