-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('ONSITE', 'HYBRID', 'REMOTE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "SwipeDirection" AS ENUM ('LIKE', 'SKIP');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'APPLIED', 'INTERVIEWING', 'REJECTED', 'OFFER');

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_arrangement" "WorkArrangement" NOT NULL,
    "employment_type" "EmploymentType" NOT NULL,
    "salary_min" INTEGER,
    "salary_max" INTEGER,
    "description" TEXT NOT NULL,
    "is_demo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_skills" (
    "job_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("job_id","skill_id")
);

-- CreateTable
CREATE TABLE "candidate_profiles" (
    "user_id" UUID NOT NULL,
    "headline" TEXT,
    "education" TEXT,
    "experience" TEXT,
    "projects" TEXT,
    "desired_roles" TEXT[],
    "preferred_salary_min" INTEGER,
    "preferred_work_arrangement" "WorkArrangement",
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "candidate_skills" (
    "user_id" UUID NOT NULL,
    "skill_id" TEXT NOT NULL,

    CONSTRAINT "candidate_skills_pkey" PRIMARY KEY ("user_id","skill_id")
);

-- CreateTable
CREATE TABLE "job_interactions" (
    "user_id" UUID NOT NULL,
    "job_id" TEXT NOT NULL,
    "direction" "SwipeDirection" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_interactions_pkey" PRIMARY KEY ("user_id","job_id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "job_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'INTERESTED',
    "notes" TEXT,
    "employer_feedback" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "applications_user_id_status_idx" ON "applications"("user_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_user_id_job_id_key" ON "applications"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_skills" ADD CONSTRAINT "candidate_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_interactions" ADD CONSTRAINT "job_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_interactions" ADD CONSTRAINT "job_interactions_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
