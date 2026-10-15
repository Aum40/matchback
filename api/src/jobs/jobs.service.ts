import { CandidatesService } from '@/candidates/candidates.service';
import { JobStatus, SwipeDirection } from '@/database/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { calculateMatch } from '@/matching/match-score';
import { MatchesService } from '@/matches/matches.service';
import {
  JOB_SELECT,
  JobResponse,
  toJobResponse,
  toMatchJob,
} from './job.select';
import { Injectable, NotFoundException } from '@nestjs/common';

// ย้ายไป job.select.ts แล้ว re-export ไว้ ไฟล์อื่นที่ import จากที่นี่ใช้ต่อได้
export { JOB_SELECT, toJobResponse, toMatchJob } from './job.select';
export type { JobResponse } from './job.select';

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly candidatesService: CandidatesService,
    private readonly matchesService: MatchesService,
  ) {}

  async findAll() {
    const jobs = await this.prisma.job.findMany({
      where: { status: JobStatus.PUBLISHED },
      select: JOB_SELECT,
      orderBy: { createdAt: 'asc' },
    });
    return jobs.map(toJobResponse);
  }

  async findOne(id: string): Promise<JobResponse> {
    // DRAFT/CLOSED ตอบ 404 เหมือนไม่มีงานนี้ (จัดการได้ทาง route ของ recruiter เท่านั้น)
    const job = await this.prisma.job.findFirst({
      where: { id, status: JobStatus.PUBLISHED },
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
        where: {
          status: JobStatus.PUBLISHED,
          interactions: { none: { userId } },
        },
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

    // อ่านอีกฝั่งหลังการปัดนี้ commit แล้วเท่านั้น (ดู MatchesService.syncMatch)
    const match = await this.matchesService.syncMatch(userId, jobId);
    return { jobId, direction, ...match, application: application ?? null };
  }

  /** ล้างประวัติการปัดทั้งหมด (ปุ่ม "Start over" ตอนการ์ดหมด) — ไม่แตะ application */
  async resetSwipes(userId: string) {
    const { count } = await this.prisma.jobInteraction.deleteMany({
      where: { userId },
    });
    return { cleared: count };
  }
}
