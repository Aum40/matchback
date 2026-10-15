import { Prisma } from '@/database/generated/prisma/client';
import type { MatchJob } from '@/matching/match-score';

/**
 * รูปข้อมูลงานที่ส่งให้เว็บ — แยกไฟล์ออกจาก jobs.service.ts เพื่อไม่ให้ import วนกัน
 * (jobs.service → matches.service → JOB_SELECT) ซึ่งทำให้ค่าคงที่เป็น undefined ตอนโหลด
 */
export const JOB_SELECT = {
  id: true,
  title: true,
  company: true,
  location: true,
  workArrangement: true,
  employmentType: true,
  salaryMin: true,
  salaryMax: true,
  description: true,
  isDemo: true,
  skills: {
    select: { required: true, skill: { select: { id: true, name: true } } },
    // required ขึ้นก่อน แล้วเรียงชื่อ: การ์ดแสดงไม่กี่ตัวแรก ต้องเป็นตัวที่สำคัญ
    orderBy: [{ required: 'desc' }, { skill: { name: 'asc' } }],
  },
} satisfies Prisma.JobSelect;

type JobRow = Prisma.JobGetPayload<{ select: typeof JOB_SELECT }>;

/** รูปที่ส่งให้เว็บ: แผ่ skills ให้แบน ไม่ให้เว็บผูกกับโครงตาราง join */
export function toJobResponse<T extends JobRow>(job: T) {
  return {
    ...job,
    skills: job.skills.map(({ required, skill }) => ({ ...skill, required })),
  };
}

export type JobResponse = ReturnType<typeof toJobResponse<JobRow>>;

export function toMatchJob(job: JobResponse): MatchJob {
  return {
    title: job.title,
    workArrangement: job.workArrangement,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    skills: job.skills,
  };
}
