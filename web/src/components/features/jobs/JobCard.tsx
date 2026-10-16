import ScoreBadge from "@/components/features/jobs/ScoreBadge";
import SkillChips, { type SkillState } from "@/components/features/jobs/SkillChips";
import { Badge } from "@/components/ui/badge";
import type { Job } from "@/lib/api/api.type";
import {
  EMPLOYMENT_TYPE_LABELS,
  formatSalary,
  WORK_ARRANGEMENT_LABELS,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { Banknote, Briefcase, MapPin } from "lucide-react";

/**
 * การ์ดงาน (แสดงผลล้วน ไม่มี state) ใช้ทั้งในกองปัด หน้าแรก และรายการที่บันทึก
 * ข้อมูลเดโมต้องมีป้าย "Demo data" เสมอ ไม่ให้คนเข้าใจว่าเป็นประกาศจริง
 */
export default function JobCard({
  job,
  score,
  skillStates,
  skillLimit = 6,
  showDescription = true,
  className,
  children,
}: {
  job: Job;
  score?: number;
  skillStates?: Record<string, SkillState>;
  skillLimit?: number;
  showDescription?: boolean;
  className?: string;
  /** ปุ่ม/ลิงก์ท้ายการ์ด */
  children?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-xl shadow-navy/10",
        className,
      )}
      aria-labelledby={`job-${job.id}-title`}
    >
      <div
        aria-hidden="true"
        className="relative h-28 overflow-hidden bg-brand-soft"
        style={{
          background:
            "radial-gradient(circle at 18% 20%, var(--highlight), transparent 32%), radial-gradient(circle at 84% 8%, color-mix(in oklch, var(--brand) 45%, transparent), transparent 44%), linear-gradient(135deg, var(--brand-soft), var(--background))",
        }}
      >
        <div className="absolute -right-10 -top-20 size-52 rounded-full border-[22px] border-card/40" />
        <div className="absolute -bottom-24 left-1/3 size-56 rounded-full border-[26px] border-brand/20" />
        {job.isDemo && (
          <Badge className="absolute left-5 top-5 bg-card/85 text-navy shadow-sm">Demo data</Badge>
        )}
      </div>

      <div className="flex flex-col gap-5 p-5 sm:p-6">
        <header className="flex items-start gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <h2 id={`job-${job.id}-title`} className="text-2xl leading-tight font-bold tracking-[-0.03em] text-navy">
              {job.title}
            </h2>
            <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
          </div>
          {score !== undefined && <ScoreBadge score={score} size="lg" />}
        </header>

        <dl className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <dt>
              <MapPin className="size-4 text-brand" aria-hidden="true" />
              <span className="sr-only">Location</span>
            </dt>
            <dd>{job.location} / {WORK_ARRANGEMENT_LABELS[job.workArrangement]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <Briefcase className="size-4 text-brand" aria-hidden="true" />
              <span className="sr-only">Employment type</span>
            </dt>
            <dd>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</dd>
          </div>
          <div className="flex items-center gap-2">
            <dt>
              <Banknote className="size-4 text-brand" aria-hidden="true" />
              <span className="sr-only">Salary</span>
            </dt>
            <dd>{formatSalary(job.salaryMin, job.salaryMax)}</dd>
          </div>
        </dl>

        {showDescription && (
          <p className="border-y border-border py-5 leading-7 text-muted-foreground">{job.description}</p>
        )}

        <div role="group" aria-label="Job skills">
          <h3 className="mb-3 text-sm font-semibold text-navy">Key skills</h3>
          <SkillChips skills={job.skills} states={skillStates} limit={skillLimit} />
        </div>

        {children && <div className="border-t border-border pt-5">{children}</div>}
      </div>
    </article>
  );
}
