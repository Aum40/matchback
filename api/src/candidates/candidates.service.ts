import { UpdateProfileDto } from '@/candidates/dto/update-profile.dto';
import { PrismaService } from '@/database/prisma.service';
import type { CandidateFacts } from '@/infrastructure/ai/ai.types';
import type { WorkArrangement } from '@/database/generated/prisma/enums';
import type { MatchCandidate } from '@/matching/match-score';
import { BadRequestException, Injectable } from '@nestjs/common';

const PROFILE_SELECT = {
  headline: true,
  education: true,
  experience: true,
  projects: true,
  desiredRoles: true,
  preferredSalaryMin: true,
  preferredWorkArrangement: true,
  updatedAt: true,
} as const;

/**
 * แปลงโปรไฟล์เป็น input ของ calculateMatch() — ที่เดียวที่กำหนดว่าคะแนนอ่านอะไรจากโปรไฟล์
 * ใช้ทั้งฝั่งผู้สมัคร (getMatchInputs) และ deck ของ recruiter (ผู้สมัครหลายคนพร้อมกัน)
 * สองฝั่งจึงได้คะแนนเท่ากันเสมอสำหรับคู่ผู้สมัคร/งานเดียวกัน
 */
export function buildMatchCandidate(
  profile: {
    experience: string | null;
    projects: string | null;
    education: string | null;
    desiredRoles: string[];
    preferredSalaryMin: number | null;
    preferredWorkArrangement: WorkArrangement | null;
  } | null,
  skillIds: string[],
): MatchCandidate {
  return {
    skillIds,
    profileText: [profile?.experience, profile?.projects, profile?.education]
      .filter(Boolean)
      .join('\n'),
    desiredRoles: profile?.desiredRoles ?? [],
    preferredSalaryMin: profile?.preferredSalaryMin ?? null,
    preferredWorkArrangement: profile?.preferredWorkArrangement ?? null,
  };
}

@Injectable()
export class CandidatesService {
  constructor(private readonly prisma: PrismaService) {}

  /** ยังไม่เคยบันทึก = คืนโปรไฟล์ว่าง (ไม่ใช่ 404) หน้าเว็บจะได้แสดงฟอร์มเปล่าได้เลย */
  async getProfile(userId: string) {
    const [profile, skills] = await Promise.all([
      this.prisma.candidateProfile.findUnique({
        where: { userId },
        select: PROFILE_SELECT,
      }),
      this.prisma.candidateSkill.findMany({
        where: { userId },
        select: { skill: { select: { id: true, name: true } } },
        orderBy: { skill: { name: 'asc' } },
      }),
    ]);

    return {
      headline: profile?.headline ?? null,
      education: profile?.education ?? null,
      experience: profile?.experience ?? null,
      projects: profile?.projects ?? null,
      desiredRoles: profile?.desiredRoles ?? [],
      preferredSalaryMin: profile?.preferredSalaryMin ?? null,
      preferredWorkArrangement: profile?.preferredWorkArrangement ?? null,
      skills: skills.map(({ skill }) => skill),
      isComplete: Boolean(profile) && skills.length > 0,
      updatedAt: profile?.updatedAt ?? null,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const skillIds = [...new Set(dto.skillIds ?? [])];

    // รายการทักษะมาจาก browser: id ที่ไม่มีในตาราง skills ต้องตอบ 400 ชัด ๆ
    // ไม่งั้น foreign key ล้มกลายเป็น 500
    if (skillIds.length > 0) {
      const known = await this.prisma.skill.count({
        where: { id: { in: skillIds } },
      });
      if (known !== skillIds.length) {
        throw new BadRequestException({
          message: 'Some skills do not exist',
          code: 'UNKNOWN_SKILL',
        });
      }
    }

    const data = {
      headline: dto.headline || null,
      education: dto.education || null,
      experience: dto.experience || null,
      projects: dto.projects || null,
      desiredRoles: dto.desiredRoles ?? [],
      preferredSalaryMin: dto.preferredSalaryMin ?? null,
      preferredWorkArrangement: dto.preferredWorkArrangement ?? null,
    };

    // โปรไฟล์กับรายการทักษะต้องเปลี่ยนพร้อมกัน ไม่งั้นคะแนนคำนวณจากข้อมูลครึ่งเก่าครึ่งใหม่
    await this.prisma.$transaction([
      this.prisma.candidateProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      }),
      this.prisma.candidateSkill.deleteMany({ where: { userId } }),
      this.prisma.candidateSkill.createMany({
        data: skillIds.map((skillId) => ({ userId, skillId })),
      }),
    ]);

    return this.getProfile(userId);
  }

  /** แปลงโปรไฟล์เป็น input ของ calculateMatch() และข้อมูลที่ส่งให้ AI */
  async getMatchInputs(
    userId: string,
  ): Promise<{ candidate: MatchCandidate; facts: CandidateFacts }> {
    const profile = await this.getProfile(userId);

    return {
      candidate: buildMatchCandidate(
        profile,
        profile.skills.map((skill) => skill.id),
      ),
      facts: {
        headline: profile.headline,
        education: profile.education,
        experience: profile.experience,
        projects: profile.projects,
        desiredRoles: profile.desiredRoles,
        skills: profile.skills.map((skill) => skill.name),
      },
    };
  }
}
