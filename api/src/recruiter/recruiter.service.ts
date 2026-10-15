import { buildMatchCandidate } from '@/candidates/candidates.service';
import { CompaniesService } from '@/companies/companies.service';
import { Prisma } from '@/database/generated/prisma/client';
import {
  JobStatus,
  Role,
  SwipeDirection,
  UserStatus,
} from '@/database/generated/prisma/enums';
import { PrismaService } from '@/database/prisma.service';
import { JOB_SELECT, toJobResponse, toMatchJob } from '@/jobs/job.select';
import { MatchesService } from '@/matches/matches.service';
import { calculateMatch } from '@/matching/match-score';
import { CreateJobDto, JobSkillInputDto } from '@/recruiter/dto/create-job.dto';
import { UpdateJobDto } from '@/recruiter/dto/update-job.dto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'node:crypto';

const RECRUITER_JOB_SELECT = {
  ...JOB_SELECT,
  status: true,
  companyId: true,
  _count: {
    select: {
      // จำนวนผู้สมัครที่ฝั่งบริษัท LIKE ไปแล้ว — ไม่ใช่จำนวนผู้สมัครที่ LIKE งานนี้
      // (ห้ามเปิดเผยการตัดสินใจของผู้สมัครก่อน match แม้เป็นตัวเลขรวมก็ตาม)
      candidateInteractions: { where: { direction: SwipeDirection.LIKE } },
      matches: true,
    },
  },
} satisfies Prisma.JobSelect;

type RecruiterJobRow = Prisma.JobGetPayload<{
  select: typeof RECRUITER_JOB_SELECT;
}>;

function toRecruiterJob({ _count, ...job }: RecruiterJobRow) {
  return {
    ...toJobResponse(job),
    likeCount: _count.candidateInteractions,
    matchCount: _count.matches,
  };
}

/** ผู้สมัครที่ปรากฏใน deck / ปัดได้: บัญชีผู้สมัครที่ใช้งานอยู่ และติ๊กทักษะไว้อย่างน้อย 1 ตัว */
const ELIGIBLE_CANDIDATE: Prisma.UserWhereInput = {
  role: Role.USER,
  status: UserStatus.ACTIVE,
  deletedAt: null,
  skills: { some: {} },
};

const notFound = () =>
  new NotFoundException({ message: 'Job not found', code: 'JOB_NOT_FOUND' });

@Injectable()
export class RecruiterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companiesService: CompaniesService,
    private readonly matchesService: MatchesService,
  ) {}

  async listJobs(userId: string) {
    const company = await this.companiesService.requireCompany(userId);
    const jobs = await this.prisma.job.findMany({
      where: { companyId: company.id },
      select: RECRUITER_JOB_SELECT,
      orderBy: { createdAt: 'desc' },
    });
    return jobs.map(toRecruiterJob);
  }

  async createJob(userId: string, dto: CreateJobDto) {
    const company = await this.companiesService.requireCompany(userId);
    this.assertSalaryRange(dto.salaryMin ?? null, dto.salaryMax ?? null);
    await this.assertSkills(dto.skills);

    const { skills, ...fields } = dto;
    const job = await this.prisma.job.create({
      data: {
        ...fields,
        // งานที่ recruiter สร้าง id เป็น uuid (งาน seed ใช้ slug อย่าง job-001)
        id: crypto.randomUUID(),
        companyId: company.id,
        company: company.name,
        isDemo: false,
        status: JobStatus.DRAFT,
        skills: {
          create: skills.map(({ id, required }) => ({ skillId: id, required })),
        },
      },
      select: RECRUITER_JOB_SELECT,
    });
    return toRecruiterJob(job);
  }

  async updateJob(userId: string, jobId: string, dto: UpdateJobDto) {
    const job = await this.ownedJob(userId, jobId);
    this.assertSalaryRange(
      dto.salaryMin !== undefined ? dto.salaryMin : job.salaryMin,
      dto.salaryMax !== undefined ? dto.salaryMax : job.salaryMax,
    );
    if (dto.skills) await this.assertSkills(dto.skills);

    const { skills, ...fields } = dto;
    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: {
        ...fields,
        // ส่ง skills มา = แทนที่ทั้งชุด ไม่ส่ง = คงเดิม
        ...(skills && {
          skills: {
            deleteMany: {},
            create: skills.map(({ id, required }) => ({
              skillId: id,
              required,
            })),
          },
        }),
      },
      select: RECRUITER_JOB_SELECT,
    });
    return toRecruiterJob(updated);
  }

  /**
   * deck ของงานหนึ่งงาน: ผู้สมัครที่บริษัทยังไม่เคยตัดสินใจ เรียงคะแนนมากไปน้อย
   * ห้ามบอกว่าผู้สมัครเคย LIKE งานนี้หรือไม่ (ไม่ query JobInteraction เลย)
   * ก่อน match ให้แค่ชื่อต้น — ไม่มีอีเมล ไม่มีนามสกุล
   */
  async candidateDeck(userId: string, jobId: string) {
    const job = await this.publishedOwnedJob(userId, jobId);
    const matchJob = toMatchJob(toJobResponse(job));

    const candidates = await this.prisma.user.findMany({
      where: {
        ...ELIGIBLE_CANDIDATE,
        receivedSwipes: { none: { jobId } },
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            headline: true,
            education: true,
            experience: true,
            projects: true,
            desiredRoles: true,
            preferredSalaryMin: true,
            preferredWorkArrangement: true,
          },
        },
        skills: {
          select: { skill: { select: { id: true, name: true } } },
          orderBy: { skill: { name: 'asc' } },
        },
      },
      // ระดับเดโมผู้สมัครมีไม่กี่คน เพดานนี้กันแค่ไม่ให้ query บานถ้ามีคนสมัครเยอะ
      take: 200,
    });

    return candidates
      .map(({ id, name, profile, skills }) => {
        const skillList = skills.map(({ skill }) => skill);
        const match = calculateMatch(
          buildMatchCandidate(
            profile,
            skillList.map((skill) => skill.id),
          ),
          matchJob,
        );
        return {
          candidateId: id,
          displayName: name.trim().split(/\s+/)[0] ?? name,
          headline: profile?.headline ?? null,
          education: profile?.education ?? null,
          experience: profile?.experience ?? null,
          projects: profile?.projects ?? null,
          skills: skillList,
          match: {
            score: match.score,
            matchedSkillIds: match.matchedSkills.map((skill) => skill.id),
            unconfirmedSkillIds: match.unconfirmedSkills.map(
              (skill) => skill.id,
            ),
            missingSkillIds: match.missingSkills.map((skill) => skill.id),
          },
        };
      })
      .sort(
        (a, b) =>
          b.match.score - a.match.score ||
          a.candidateId.localeCompare(b.candidateId),
      );
  }

  /** ปัดซ้ำ = เขียนทับ (หนึ่งคำตัดสินต่อคู่งาน/ผู้สมัคร) แล้วเช็ก mutual match */
  async swipeCandidate(
    userId: string,
    jobId: string,
    candidateId: string,
    direction: SwipeDirection,
  ) {
    await this.publishedOwnedJob(userId, jobId);

    const candidate = await this.prisma.user.findFirst({
      where: { ...ELIGIBLE_CANDIDATE, id: candidateId },
      select: { id: true },
    });
    if (!candidate) {
      throw new NotFoundException({
        message: 'Candidate not found',
        code: 'CANDIDATE_NOT_FOUND',
      });
    }

    await this.prisma.candidateInteraction.upsert({
      where: { jobId_candidateId: { jobId, candidateId } },
      create: { jobId, candidateId, recruiterId: userId, direction },
      update: { direction, recruiterId: userId, createdAt: new Date() },
    });

    // อ่านอีกฝั่งหลังการปัดนี้ commit แล้วเท่านั้น (ดู MatchesService.syncMatch)
    const match = await this.matchesService.syncMatch(candidateId, jobId);
    return { jobId, direction, ...match, application: null };
  }

  /** match ของงานนี้ (งานสถานะไหนก็ได้ ขอให้เป็นของบริษัทตัวเอง) */
  async jobMatches(userId: string, jobId: string) {
    await this.ownedJob(userId, jobId);
    return this.matchesService.findAllFor(
      { sub: userId, role: Role.RECRUITER },
      jobId,
    );
  }

  /**
   * งานของบริษัทผู้เรียก (บริษัทอ่านจาก DB เสมอ) — ของบริษัทอื่นตอบ 404 เหมือนไม่มีงานนี้
   * ไม่ตอบ 403 เพราะจะเป็นการบอกว่างาน id นี้มีอยู่จริง
   */
  private async ownedJob(userId: string, jobId: string) {
    const company = await this.companiesService.requireCompany(userId);
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, companyId: company.id },
      select: { ...JOB_SELECT, status: true },
    });
    if (!job) throw notFound();
    return job;
  }

  /** deck และการปัดทำได้เฉพาะงาน PUBLISHED: DRAFT/CLOSED ตอบ 409 JOB_NOT_PUBLISHED */
  private async publishedOwnedJob(userId: string, jobId: string) {
    const job = await this.ownedJob(userId, jobId);
    if (job.status !== JobStatus.PUBLISHED) {
      throw new ConflictException({
        message: 'Publish this job before reviewing candidates',
        code: 'JOB_NOT_PUBLISHED',
      });
    }
    return job;
  }

  private assertSalaryRange(min: number | null, max: number | null) {
    if (min !== null && max !== null && min > max) {
      throw new BadRequestException({
        message: 'salaryMin must not be greater than salaryMax',
        code: 'INVALID_SALARY_RANGE',
      });
    }
  }

  /** รายการทักษะมาจาก browser: ซ้ำหรือ id ที่ไม่มีจริงต้องตอบ 400 ชัด ๆ ไม่ใช่ 500 จาก FK */
  private async assertSkills(skills: JobSkillInputDto[]) {
    const ids = skills.map((skill) => skill.id);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException({
        message: 'Each skill can be listed only once',
        code: 'DUPLICATE_SKILL',
      });
    }
    const known = await this.prisma.skill.count({ where: { id: { in: ids } } });
    if (known !== ids.length) {
      throw new BadRequestException({
        message: 'Some skills do not exist',
        code: 'UNKNOWN_SKILL',
      });
    }
  }
}
