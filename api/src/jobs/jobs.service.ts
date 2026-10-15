import { CandidatesService } from '@/candidates/candidates.service';
import { Prisma } from '@/database/generated/prisma/client';
import { SwipeDirection } from '@/database/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { calculateMatch, MatchJob } from '@/matching/match-score';
import { Injectable, NotFoundException } from '@nestjs/common';

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
export function toJobResponse(job: JobRow) {
  return {
    ...job,
    skills: job.skills.map(({ required, skill }) => ({ ...skill, required })),
  };
}

export type JobResponse = ReturnType<typeof toJobResponse>;

export function toMatchJob(job: JobResponse): MatchJob {
  return {
    title: job.title,
    workArrangement: job.workArrangement,
    salaryMin: job.salaryMin,
    salaryMax: job.salaryMax,
    skills: job.skills,
  };
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidatesService: CandidatesService,
  ) {}

  async findAll() {
    const jobs = await this.prisma.job.findMany({
      select: JOB_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return jobs.map(toJobResponse);
  }

  async findOne(id: string): Promise<JobResponse> {
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: JOB_SELECT,
    });
    if (!job) {
      throw new NotFoundException({
        message: 'Job not found',
        code: 'JOB_NOT_FOUND',
      });
    }
    return toJobResponse(job);
  }

  /**
   * กองการ์ดของหน้า Discover: งานที่ผู้ใช้ยังไม่เคยปัด เรียงคะแนนมากไปน้อย
   * คำนวณคะแนนสดทุกครั้ง (งานเดโมมีไม่กี่สิบตัว ไม่ต้อง cache)
   */
  async discover(userId: string) {
    const [{ candidate }, jobs] = await Promise.all([
      this.candidatesService.getMatchInputs(userId),
      this.prisma.job.findMany({
        where: { interactions: { none: { userId } } },
        select: JOB_SELECT,
      }),
    ]);

    return jobs
      .map(toJobResponse)
      .map((job) => {
        const match = calculateMatch(candidate, toMatchJob(job));
        return {
          ...job,
          match: {
            score: match.score,
            matchedSkillIds: match.matchedSkills.map((skill) => skill.id),
            missingSkillIds: match.missingSkills.map((skill) => skill.id),
            unconfirmedSkillIds: match.unconfirmedSkills.map(
              (skill) => skill.id,
            ),
          },
        };
      })
      .sort(
        (a, b) => b.match.score - a.match.score || a.id.localeCompare(b.id),
      );
  }

  /**
   * ปัดซ้ำ = เขียนทับทิศเดิม
   * ปัดขวาสร้าง application สถานะ INTERESTED (มีอยู่แล้วไม่แตะ ไม่ให้สถานะ APPLIED ถอยกลับ)
   * ปัดซ้ายไม่ลบ application เดิม: ผู้ใช้อาจสมัครไปแล้วจริง ลบเองได้ที่หน้า Saved
   */
  async swipe(userId: string, jobId: string, direction: SwipeDirection) {
    await this.findOne(jobId);

    const [, application] = await this.prisma.$transaction([
      this.prisma.jobInteraction.upsert({
        where: { userId_jobId: { userId, jobId } },
        create: { userId, jobId, direction },
        update: { direction, createdAt: new Date() },
      }),
      ...(direction === SwipeDirection.LIKE
        ? [
            this.prisma.application.upsert({
              where: { userId_jobId: { userId, jobId } },
              create: { userId, jobId },
              update: {},
              select: { id: true, status: true },
            }),
          ]
        : []),
    ]);

    return { jobId, direction, application: application ?? null };
  }

  /** ล้างประวัติการปัดทั้งหมด (ปุ่ม "Start over" ตอนการ์ดหมด) — ไม่แตะ application */
  async resetSwipes(userId: string) {
    const { count } = await this.prisma.jobInteraction.deleteMany({
      where: { userId },
    });
    return { cleared: count };
  }
}
