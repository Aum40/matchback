-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'RECRUITER';

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "company_id" UUID,
ADD COLUMN     "status" "JobStatus" NOT NULL DEFAULT 'DRAFT';

-- Backfill (เพิ่มเอง ไม่ได้มาจาก Prisma): default ของคอลัมน์ใหม่คือ DRAFT ซึ่งจะทำให้
-- งานทุกงานที่มีอยู่แล้ว (งานเดโมจาก seed บนทุกเครื่องและบน production) หายจากหน้า Discover
-- งานที่มีอยู่ก่อน migration นี้ผู้สมัครเห็นอยู่แล้ว จึงถือเป็น PUBLISHED
-- งานที่ recruiter สร้างหลังจากนี้ยังเริ่มที่ DRAFT ตามปกติ
UPDATE "jobs" SET "status" = 'PUBLISHED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "company_id" UUID;

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_interactions" (
    "job_id" TEXT NOT NULL,
    "candidate_id" UUID NOT NULL,
    "recruiter_id" UUID NOT NULL,
    "direction" "SwipeDirection" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_interactions_pkey" PRIMARY KEY ("job_id","candidate_id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "job_id" TEXT NOT NULL,
    "candidate_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "candidate_interactions_candidate_id_idx" ON "candidate_interactions"("candidate_id");

-- CreateIndex
CREATE INDEX "candidate_interactions_recruiter_id_idx" ON "candidate_interactions"("recruiter_id");

-- CreateIndex
CREATE INDEX "matches_job_id_idx" ON "matches"("job_id");

-- CreateIndex
CREATE UNIQUE INDEX "matches_candidate_id_job_id_key" ON "matches"("candidate_id", "job_id");

-- CreateIndex
CREATE INDEX "jobs_status_idx" ON "jobs"("status");

-- CreateIndex
CREATE INDEX "jobs_company_id_idx" ON "jobs"("company_id");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_interactions" ADD CONSTRAINT "candidate_interactions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_interactions" ADD CONSTRAINT "candidate_interactions_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_interactions" ADD CONSTRAINT "candidate_interactions_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
