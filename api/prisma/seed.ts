/**
 * seed ข้อมูลเดโม — รันด้วย `pnpm db:seed` (prisma migrate reset ก็เรียกไฟล์นี้ให้เอง)
 *   1. ทักษะ บริษัท และงานตัวอย่าง (seed-data.ts) — upsert ด้วย id คงที่ รันซ้ำได้
 *   2. แอดมินจาก SEED_ADMIN_* (ไม่ตั้งรหัส = ข้าม)
 *   3. ผู้สมัครเดโม 2 คน (SEED_DEMO_*) และ recruiter เดโม (SEED_RECRUITER_*) (ไม่ตั้งรหัส = ข้าม)
 * ทุกครั้งที่รัน สถานะเดโมกลับไปเริ่มต้นใหม่: การปัด, งานที่บันทึก และ match ของบัญชีเดโมถูกล้าง
 * ห้ามใส่รหัสผ่านจริงลงในไฟล์นี้หรือ .env.example — อ่านจาก .env เท่านั้น
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import z from 'zod';
import { STRONG_PASSWORD } from '../src/common/decorator/strong-password.decorator';
import { PrismaClient } from '../src/database/generated/prisma/client';
import {
  COMPANIES,
  DEMO_CANDIDATE_2,
  DEMO_PROFILE,
  DEMO_RECRUITER,
  JOBS,
  SKILLS,
} from './seed-data';

// กฎเดียวกับตอนสมัคร (@StrongPassword) ไม่งั้นได้บัญชีที่หน้าเว็บไม่ยอมรับรหัส
const password = z
  .string()
  .regex(
    STRONG_PASSWORD,
    '8-72 chars with lowercase, uppercase, number and symbol',
  );
const blankToUndefined = (value: unknown) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const env = z
  .object({
    DATABASE_URL: z.url(),
    SEED_ADMIN_EMAIL: z.email().default('admin@example.com'),
    SEED_ADMIN_PASSWORD: z.preprocess(blankToUndefined, password.optional()),
    SEED_ADMIN_NAME: z.string().trim().min(1).default('Admin'),
    SEED_DEMO_EMAIL: z.email().default('demo@matchback.dev'),
    // ผู้สมัครเดโมคนที่สองใช้รหัสเดียวกับคนแรก (ลด env ที่ต้องตั้ง)
    SEED_DEMO2_EMAIL: z.email().default('demo2@matchback.dev'),
    SEED_DEMO_PASSWORD: z.preprocess(blankToUndefined, password.optional()),
    SEED_RECRUITER_EMAIL: z.email().default('recruiter@matchback.dev'),
    SEED_RECRUITER_PASSWORD: z.preprocess(
      blankToUndefined,
      password.optional(),
    ),
  })
  .parse(process.env);

// saltRounds เท่ากับ BcryptService (12)
const hash = (plain: string) => bcrypt.hash(plain, 12);

const companyIdByName = new Map<string, string>(
  COMPANIES.map((company) => [company.name, company.id]),
);

async function seedCatalog(prisma: PrismaClient) {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      create: skill,
      update: skill,
    });
  }

  for (const company of COMPANIES) {
    const data = { ...company, isDemo: true };
    await prisma.company.upsert({
      where: { id: company.id },
      create: data,
      update: data,
    });
  }

  for (const { required, niceToHave, ...job } of JOBS) {
    const skills = [
      ...required.map((skillId) => ({ skillId, required: true })),
      ...niceToHave.map((skillId) => ({ skillId, required: false })),
    ];
    // ชื่อบริษัทใน JOBS ต้องตรงกับ COMPANIES (seed-data.spec.ts ตรวจไว้) ไม่งั้นงานไม่มีเจ้าของ
    // งานเดโมเป็น PUBLISHED เสมอ ผู้สมัครถึงจะเห็นในหน้า Discover
    const data = {
      ...job,
      isDemo: true,
      status: 'PUBLISHED' as const,
      companyId: companyIdByName.get(job.company) ?? null,
    };
    // แทนที่รายการทักษะทั้งชุด: แก้ seed-data แล้วรันใหม่ได้ผลตรงไฟล์เสมอ
    await prisma.job.upsert({
      where: { id: job.id },
      create: { ...data, skills: { create: skills } },
      update: { ...data, skills: { deleteMany: {}, create: skills } },
    });
  }

  console.log(
    `Seeded ${SKILLS.length} skills, ${COMPANIES.length} demo companies and ${JOBS.length} demo jobs`,
  );
}

async function seedUser(
  prisma: PrismaClient,
  input: {
    email: string;
    password: string;
    name: string;
    role: 'USER' | 'RECRUITER' | 'ADMIN';
    companyId?: string;
  },
) {
  const email = input.email.toLowerCase();
  const hashed = await hash(input.password);
  const companyId = input.companyId ?? null;
  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: input.name,
      password: hashed,
      role: input.role,
      companyId,
    },
    update: {
      password: hashed,
      role: input.role,
      companyId,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: { id: true, email: true },
  });
}

type CandidateSeed = Omit<typeof DEMO_PROFILE, 'skillIds'> & {
  skillIds: readonly string[];
  likedJobIds?: readonly string[];
};

/** ตั้งโปรไฟล์ผู้สมัครเดโมใหม่ และล้างทุกอย่างที่เดโมรอบก่อนทิ้งไว้ */
async function seedCandidate(
  prisma: PrismaClient,
  userId: string,
  { name: _name, skillIds, likedJobIds = [], ...profile }: CandidateSeed,
) {
  await prisma.$transaction([
    prisma.candidateProfile.upsert({
      where: { userId },
      create: { userId, ...profile },
      update: profile,
    }),
    prisma.candidateSkill.deleteMany({ where: { userId } }),
    prisma.candidateSkill.createMany({
      data: skillIds.map((skillId) => ({ userId, skillId })),
    }),
    // เริ่มเดโมใหม่ทุกครั้ง: กองการ์ดเต็ม ไม่มีงานที่บันทึก ไม่มี match ค้าง
    // และล้างการตัดสินใจของฝั่งบริษัทต่อผู้สมัครคนนี้ด้วย ไม่งั้น deck ของ recruiter ไม่มีเขาให้ปัด
    prisma.match.deleteMany({ where: { candidateId: userId } }),
    prisma.candidateInteraction.deleteMany({ where: { candidateId: userId } }),
    prisma.jobInteraction.deleteMany({ where: { userId } }),
    prisma.application.deleteMany({ where: { userId } }),
    // การปัดที่ seed ตั้งไว้ล่วงหน้า (ผู้สมัครคนที่สอง LIKE job-001) เหมือนผู้สมัครปัดเองจริง
    // รวมถึงสร้างรายการ INTERESTED แบบเดียวกับที่ JobsService.swipe ทำ
    prisma.jobInteraction.createMany({
      data: likedJobIds.map((jobId) => ({
        userId,
        jobId,
        direction: 'LIKE' as const,
      })),
    }),
    prisma.application.createMany({
      data: likedJobIds.map((jobId) => ({ userId, jobId })),
    }),
  ]);
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

  try {
    await seedCatalog(prisma);

    if (env.SEED_ADMIN_PASSWORD) {
      const admin = await seedUser(prisma, {
        email: env.SEED_ADMIN_EMAIL,
        password: env.SEED_ADMIN_PASSWORD,
        name: env.SEED_ADMIN_NAME,
        role: 'ADMIN',
      });
      console.log(`Seeded admin ${admin.email}`);
    } else {
      console.log('Skipped admin (SEED_ADMIN_PASSWORD not set)');
    }

    if (env.SEED_DEMO_PASSWORD) {
      const demo = await seedUser(prisma, {
        email: env.SEED_DEMO_EMAIL,
        password: env.SEED_DEMO_PASSWORD,
        name: DEMO_PROFILE.name,
        role: 'USER',
      });
      await seedCandidate(prisma, demo.id, DEMO_PROFILE);

      const demo2 = await seedUser(prisma, {
        email: env.SEED_DEMO2_EMAIL,
        password: env.SEED_DEMO_PASSWORD,
        name: DEMO_CANDIDATE_2.name,
        role: 'USER',
      });
      await seedCandidate(prisma, demo2.id, DEMO_CANDIDATE_2);
      console.log(`Seeded demo candidates ${demo.email}, ${demo2.email}`);
    } else {
      console.log('Skipped demo candidates (SEED_DEMO_PASSWORD not set)');
    }

    if (env.SEED_RECRUITER_PASSWORD) {
      const recruiter = await seedUser(prisma, {
        email: env.SEED_RECRUITER_EMAIL,
        password: env.SEED_RECRUITER_PASSWORD,
        name: DEMO_RECRUITER.name,
        role: 'RECRUITER',
        companyId: DEMO_RECRUITER.companyId,
      });
      // ล้างการปัดผู้สมัครของ recruiter เดโมรอบก่อน deck จะได้เต็มเหมือนเริ่มเดโมใหม่
      await prisma.candidateInteraction.deleteMany({
        where: { recruiterId: recruiter.id },
      });
      console.log(`Seeded demo recruiter ${recruiter.email}`);
    } else {
      console.log('Skipped demo recruiter (SEED_RECRUITER_PASSWORD not set)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
