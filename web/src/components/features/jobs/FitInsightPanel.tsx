import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { DiscoverJob } from "@/lib/api/api.type";
import { CheckCircle2, CircleAlert, Sparkles } from "lucide-react";

function skillNames(job: DiscoverJob, ids: string[]) {
  return ids.map((id) => job.skills.find((skill) => skill.id === id)?.name ?? id);
}

export default function FitInsightPanel({ job }: { job?: DiscoverJob }) {
  if (!job) {
    return (
      <aside className="rounded-3xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        Fit insight will appear when jobs are available.
      </aside>
    );
  }

  const matched = skillNames(job, job.match.matchedSkillIds);
  const unconfirmed = skillNames(job, job.match.unconfirmedSkillIds);
  const missing = skillNames(job, job.match.missingSkillIds);

  return (
    <aside className="rounded-3xl border border-border bg-card p-6 shadow-lg shadow-navy/5 xl:sticky xl:top-8">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Sparkles aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="font-bold tracking-[-0.02em] text-navy">Fit Insight</h2>
          <p className="text-xs text-muted-foreground">Deterministic profile fit</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-brand-soft p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Profile Fit</p>
        <p className="mt-1 text-4xl font-bold tabular-nums tracking-[-0.04em] text-navy">
          {job.match.score} <span className="text-base font-medium text-muted-foreground">/ 100</span>
        </p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Based on the skills and preferences currently listed in your profile.
        </p>
      </div>

      <div className="mt-7 space-y-5">
        <SkillGroup label="Matched skills" skills={matched} variant="success" icon={<CheckCircle2 aria-hidden="true" />} />
        <SkillGroup label="Needs more evidence" skills={unconfirmed} variant="warning" icon={<CircleAlert aria-hidden="true" />} />
        <SkillGroup label="Skills to build" skills={missing} variant="destructive" icon={<CircleAlert aria-hidden="true" />} />
      </div>

      <p className="mt-7 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">
        This score describes profile fit. It is not a hiring probability or a mutual match.
      </p>
    </aside>
  );
}

function SkillGroup({
  label,
  skills,
  variant,
  icon,
}: {
  label: string;
  skills: string[];
  variant: "success" | "warning" | "destructive";
  icon: ReactNode;
}) {
  return (
    <section>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
        <span className="[&>svg]:size-4 [&>svg]:text-brand">{icon}</span>
        {label}
      </h3>
      {skills.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill}>
              <Badge variant={variant}>{skill}</Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">None identified for this demo.</p>
      )}
    </section>
  );
}
