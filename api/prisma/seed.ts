/**
 * seed ข้อมูลเดโม — รันด้วย `pnpm db:seed` (prisma migrate reset ก็เรียกไฟล์นี้ให้เอง)
 *   1. ทักษะและงานตัวอย่าง (seed-data.ts) — upsert ด้วย id คงที่ รันซ้ำได้
 *   2. แอดมินจาก SEED_ADMIN_* (ไม่ตั้งรหัส = ข้าม)
 *   3. ผู้สมัครตัวอย่างจาก SEED_DEMO_* พร้อมโปรไฟล์ (ไม่ตั้งรหัส = ข้าม)
 * ห้ามใส่รหัสผ่านจริงลงในไฟล์นี้หรือ .env.example — อ่านจาก .env เท่านั้น
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import z from 'zod';
import { STRONG_PASSWORD } from '../src/common/decorator/strong-password.decorator';
import { PrismaClient } from '../src/database/generated/prisma/client';
import { DEMO_PROFILE, JOBS, SKILLS } from './seed-data';

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
    SEED_DEMO_PASSWORD: z.preprocess(blankToUndefined, password.optional()),
  })
  .parse(process.env);

// saltRounds เท่ากับ BcryptService (12)
const hash = (plain: string) => bcrypt.hash(plain, 12);

async function seedCatalog(prisma: PrismaClient) {
  for (const skill of SKILLS) {
    await prisma.skill.upsert({
      where: { id: skill.id },
      create: skill,
      update: skill,
    });
  }

  for (const { required, niceToHave, ...job } of JOBS) {
    const skills = [
      ...required.map((skillId) => ({ skillId, required: true })),
      ...niceToHave.map((skillId) => ({ skillId, required: false })),
    ];
    // แทนที่รายการทักษะทั้งชุด: แก้ seed-data แล้วรันใหม่ได้ผลตรงไฟล์เสมอ
    await prisma.job.upsert({
      where: { id: job.id },
      create: { ...job, isDemo: true, skills: { create: skills } },
      update: {
        ...job,
        isDemo: true,
        skills: { deleteMany: {}, create: skills },
      },
    });
  }

  console.log(`Seeded ${SKILLS.length} skills and ${JOBS.length} demo jobs`);
}

async function seedUser(
  prisma: PrismaClient,
  input: {
    email: string;
    password: string;
    name: string;
    role: 'USER' | 'ADMIN';
  },
) {
  const email = input.email.toLowerCase();
  const hashed = await hash(input.password);
  return prisma.user.upsert({
    where: { email },
    create: { email, name: input.name, password: hashed, role: input.role },
    update: {
      password: hashed,
      role: input.role,
      status: 'ACTIVE',
      deletedAt: null,
    },
    select: { id: true, email: true },
  });
}

async function seedDemoCandidate(prisma: PrismaClient, userId: string) {
  const { name: _name, skillIds, ...profile } = DEMO_PROFILE;
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
    // เริ่มเดโมใหม่ทุกครั้ง: กองการ์ดเต็ม ไม่มีงานที่บันทึกค้าง
    prisma.jobInteraction.deleteMany({ where: { userId } }),
    prisma.application.deleteMany({ where: { userId } }),
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
      await seedDemoCandidate(prisma, demo.id);
      console.log(`Seeded demo candidate ${demo.email}`);
    } else {
      console.log('Skipped demo candidate (SEED_DEMO_PASSWORD not set)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
