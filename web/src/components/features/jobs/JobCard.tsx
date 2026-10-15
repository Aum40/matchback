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
  className,
  children,
}: {
  job: Job;
  score?: number;
  skillStates?: Record<string, SkillState>;
  skillLimit?: number;
  className?: string;
  /** ปุ่ม/ลิงก์ท้ายการ์ด */
  children?: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-5 text-card-foreground shadow-sm",
        className,
      )}
      aria-labelledby={`job-${job.id}-title`}
    >
      <header className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          {job.isDemo && (
            <Badge variant="outline" className="text-muted-foreground">
              Demo data
            </Badge>
          )}
          <h2 id={`job-${job.id}-title`} className="text-lg leading-snug font-semibold">
            {job.title}
          </h2>
          <p className="text-sm text-muted-foreground">{job.company}</p>
        </div>
        {score !== undefined && <ScoreBadge score={score} />}
      </header>

      <dl className="grid gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <dt>
            <MapPin className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Location</span>
          </dt>
          <dd>
            {job.location} · {WORK_ARRANGEMENT_LABELS[job.workArrangement]}
          </dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Briefcase className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Employment type</span>
          </dt>
          <dd>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt>
            <Banknote className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">Salary</span>
          </dt>
          <dd>{formatSalary(job.salaryMin, job.salaryMax)}</dd>
        </div>
      </dl>

      <SkillChips skills={job.skills} states={skillStates} limit={skillLimit} />

      {children}
    </article>
  );
}
