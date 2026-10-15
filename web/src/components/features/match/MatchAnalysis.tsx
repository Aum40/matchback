import ScoreBadge from "@/components/features/jobs/ScoreBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { JobSkill, MatchResult } from "@/lib/api/api.type";
import { Check, HelpCircle, X } from "lucide-react";
import Link from "next/link";

// 0.5 มีสองความหมายที่ API ไม่ได้แยกให้ (hybrid ตรงครึ่งเดียว / ไม่ได้ระบุ) จึงรวมไว้ในป้ายเดียว
const FIT_LABEL = (value: number) =>
  value >= 1
    ? "Matches"
    : value <= 0
      ? "Doesn't match"
      : value === 0.5
        ? "Partial or not specified"
        : "Partly matches";

function SkillList({
  title,
  description,
  skills,
  icon: Icon,
  tone,
}: {
  title: string;
  description: string;
  skills: (JobSkill & { reason?: string })[];
  icon: typeof Check;
  tone: string;
}) {
  if (skills.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
      <ul className="space-y-1.5">
        {skills.map((skill) => (
          <li key={skill.id} className="flex items-start gap-2 text-sm">
            <Icon className={`mt-0.5 size-4 shrink-0 ${tone}`} aria-hidden="true" />
            <span>
              {skill.name}
              {!skill.required && (
                <span className="text-muted-foreground"> (nice to have)</span>
              )}
              {skill.reason === "MENTIONED_IN_PROFILE" && (
                <span className="block text-xs text-muted-foreground">
                  Mentioned in your experience or projects, but not listed as a skill.
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** ผลจับคู่แบบ deterministic จาก API (ไม่ใช่ AI) — โหลดพร้อมหน้าเสมอ */
export default function MatchAnalysis({ match }: { match: MatchResult }) {
  const noSkillsListed = match.unconfirmedSkills.some(
    (skill) => skill.reason === "NO_SKILLS_LISTED",
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <ScoreBadge score={match.score} size="lg" />
        <div className="space-y-1">
          <CardTitle>Match analysis</CardTitle>
          <CardDescription>
            Calculated from the skills and preferences in your profile. It shows
            how well your profile fits this job — it is not a prediction of being
            hired.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6">
        {noSkillsListed && (
          <p className="rounded-xl bg-warning/15 p-3 text-sm">
            You haven&apos;t listed any skills yet, so we can&apos;t tell what&apos;s
            missing.{" "}
            <Link href="/profile" className="font-medium underline">
              Add skills to your profile
            </Link>
            .
          </p>
        )}

        <div className="grid gap-6 sm:grid-cols-3">
          <SkillList
            title="Matching skills"
            description="Listed in your profile."
            skills={match.matchedSkills}
            icon={Check}
            tone="text-success"
          />
          <SkillList
            title="Not enough information"
            description="Not counted as gaps. Confirm them in your profile if you have them."
            skills={match.unconfirmedSkills}
            icon={HelpCircle}
            tone="text-warning"
          />
          <SkillList
            title="Skill gaps"
            description="Not shown anywhere in your profile."
            skills={match.missingSkills}
            icon={X}
            tone="text-destructive"
          />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium">How this score is calculated</summary>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-muted-foreground">
            <dt>Required skills (up to 70)</dt>
            <dd className="text-right tabular-nums">{match.breakdown.required}</dd>
            <dt>Nice-to-have skills (up to 15)</dt>
            <dd className="text-right tabular-nums">{match.breakdown.niceToHave}</dd>
            <dt>Preferences (up to 15)</dt>
            <dd className="text-right tabular-nums">{match.breakdown.preferences}</dd>
            <dt className="pl-3">· Work arrangement</dt>
            <dd className="text-right">{FIT_LABEL(match.preferenceFit.workArrangement)}</dd>
            <dt className="pl-3">· Salary</dt>
            <dd className="text-right">{FIT_LABEL(match.preferenceFit.salary)}</dd>
            <dt className="pl-3">· Desired role</dt>
            <dd className="text-right">{FIT_LABEL(match.preferenceFit.role)}</dd>
          </dl>
        </details>
      </CardContent>
    </Card>
  );
}
