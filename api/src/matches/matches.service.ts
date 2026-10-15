import { Prisma } from '@/database/generated/prisma/client';
import { Role, SwipeDirection } from '@/database/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { JOB_SELECT, toJobResponse } from '@/jobs/job.select';
import { Injectable, NotFoundException } from '@nestjs/common';

/** ผลของการปัดเรื่อง mutual match — ทั้งสอง swipe endpoint คืนรูปนี้ (ดู api-contract.md) */
export type MatchState = {
  /** true เฉพาะคำขอที่เป็นคน insert แถว match ใหม่ — หน้าเว็บฉลองเฉพาะกรณีนี้ */
  matchCreated: boolean;
  /** true ทุกครั้งที่มี match อยู่แล้ว (รวมการ retry และการ SKIP ทีหลัง) */
  isMatched: boolean;
  matchId: string | null;
};

const MATCH_SELECT = {
  id: true,
  createdAt: true,
  job: { select: JOB_SELECT },
  // ข้อมูลติดต่อเปิดเผยได้เพราะทั้งสองฝั่ง LIKE กันแล้วเท่านั้น
  candidate: {
    select: {
      id: true,
      name: true,
      email: true,
      profile: { select: { headline: true } },
    },
  },
} satisfies Prisma.MatchSelect;

type MatchRow = Prisma.MatchGetPayload<{ select: typeof MATCH_SELECT }>;

function toMutualMatch(row: MatchRow) {
  return {
    id: row.id,
    createdAt: row.createdAt,
    job: toJobResponse(row.job),
    candidate: {
      candidateId: row.candidate.id,
      name: row.candidate.name,
      email: row.candidate.email,
      headline: row.candidate.profile?.headline ?? null,
    },
  };
}

export type MutualMatch = ReturnType<typeof toMutualMatch>;

@Injectable()
export class MatchesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * เรียกหลังบันทึกการปัด (ฝั่งไหนก็ได้) commit แล้วเท่านั้น
   *
   * ทำไมปลอดภัยตอนสองฝั่งกดพร้อมกันโดยไม่ต้องใช้ SERIALIZABLE:
   * แต่ละคำขออ่านอีกฝั่ง "หลัง" การปัดของตัวเอง commit แล้ว คำขอที่อ่านทีหลังจึงเห็น LIKE
   * ครบทั้งสองฝั่งเสมอ ส่วนกรณีที่ทั้งสองคำขอเห็นครบพร้อมกัน unique (candidateId, jobId)
   * + skipDuplicates ทำให้มีแถวเดียว และ count บอกได้ว่าคำขอไหนเป็นคนสร้าง
   */
  async syncMatch(candidateId: string, jobId: string): Promise<MatchState> {
    const [candidateSide, companySide] = await Promise.all([
      this.prisma.jobInteraction.findUnique({
        where: { userId_jobId: { userId: candidateId, jobId } },
        select: { direction: true },
      }),
      this.prisma.candidateInteraction.findUnique({
        where: { jobId_candidateId: { jobId, candidateId } },
        select: { direction: true },
      }),
    ]);

    let matchCreated = false;
    if (
      candidateSide?.direction === SwipeDirection.LIKE &&
      companySide?.direction === SwipeDirection.LIKE
    ) {
      const { count } = await this.prisma.match.createMany({
        data: [{ candidateId, jobId }],
        skipDuplicates: true,
      });
      matchCreated = count === 1;
    }

    // อ่านแถวจริงเสมอ: SKIP ทีหลังไม่ลบ match เดิม ต้องคืน isMatched ให้ถูกด้วย
    const match = await this.prisma.match.findUnique({
      where: { candidateId_jobId: { candidateId, jobId } },
      select: { id: true },
    });

    return {
      matchCreated,
      isMatched: match !== null,
      matchId: match?.id ?? null,
    };
  }

  /** ผู้สมัครเห็น match ของตัวเอง, recruiter เห็น match ของงานบริษัทตัวเอง (companyId อ่านจาก DB) */
  async findAllFor(user: { sub: string; role: Role }, jobId?: string) {
    const where = await this.visibleWhere(user);
    if (!where) return [];

    const rows = await this.prisma.match.findMany({
      where: { ...where, ...(jobId && { jobId }) },
      select: MATCH_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toMutualMatch);
  }

  /** match ที่ไม่ใช่ของผู้เรียกตอบ 404 เหมือนไม่มี (ไม่บอกว่ามีอยู่จริง) */
  async findOneFor(user: { sub: string; role: Role }, id: string) {
    const where = await this.visibleWhere(user);
    const row = where
      ? await this.prisma.match.findFirst({
          where: { ...where, id },
          select: MATCH_SELECT,
        })
      : null;
    if (!row) {
      throw new NotFoundException({
        message: 'Match not found',
        code: 'MATCH_NOT_FOUND',
      });
    }
    return toMutualMatch(row);
  }

  /** null = ผู้เรียกไม่มีสิทธิ์เห็น match ใดเลย (เช่น recruiter ที่ยังไม่มีบริษัท) */
  private async visibleWhere(user: {
    sub: string;
    role: Role;
  }): Promise<Prisma.MatchWhereInput | null> {
    if (user.role === Role.USER) return { candidateId: user.sub };
    if (user.role !== Role.RECRUITER) return null;

    const recruiter = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { companyId: true },
    });
    return recruiter?.companyId
      ? { job: { companyId: recruiter.companyId } }
      : null;
  }
}
