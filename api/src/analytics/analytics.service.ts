import { PrismaService } from '@/database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardOverview() {
    // 1. ทักษะที่ฝั่ง Employer ต้องการมากที่สุด (Top Employer Required Skills)
    const topEmployerSkills = await this.prisma.$queryRaw<
      { id: string; name: string; count: number }[]
    >`
      SELECT s.id, s.name, COUNT(js.job_id)::int as count
      FROM skills s
      JOIN job_skills js ON s.id = js.skill_id
      GROUP BY s.id, s.name
      ORDER BY count DESC
      LIMIT 10;
    `;

    // 2. ทักษะที่ฝั่ง Candidates มีมากที่สุด (Top Candidate Skills)
    const topCandidateSkills = await this.prisma.$queryRaw<
      { id: string; name: string; count: number }[]
    >`
      SELECT s.id, s.name, COUNT(cs.user_id)::int as count
      FROM skills s
      JOIN candidate_skills cs ON s.id = cs.skill_id
      GROUP BY s.id, s.name
      ORDER BY count DESC
      LIMIT 10;
    `;

    // 3. รูปแบบการทำงาน (Work Arrangement: Employer Offered vs Candidate Preferred)
    const employerWorkArrangements = await this.prisma.job.groupBy({
      by: ['workArrangement'],
      _count: { _all: true },
    });

    const candidateWorkArrangements =
      await this.prisma.candidateProfile.groupBy({
        by: ['preferredWorkArrangement'],
        _count: { _all: true },
      });

    // 4. ช่วงเงินเดือน (Salary Statistics)
    const jobSalary = await this.prisma.job.aggregate({
      _avg: { salaryMin: true, salaryMax: true },
      _min: { salaryMin: true },
      _max: { salaryMax: true },
    });

    const candidateSalary = await this.prisma.candidateProfile.aggregate({
      _avg: { preferredSalaryMin: true },
      _min: { preferredSalaryMin: true },
      _max: { preferredSalaryMin: true },
    });

    // 5. จำนวนรวมทั้งหมด
    const totalJobs = await this.prisma.job.count();
    const totalCandidates = await this.prisma.candidateProfile.count();

    return {
      summary: {
        totalJobs,
        totalCandidates,
        avgJobSalaryMin: Math.round(jobSalary._avg.salaryMin || 0),
        avgJobSalaryMax: Math.round(jobSalary._avg.salaryMax || 0),
        avgCandidatePreferredSalary: Math.round(
          candidateSalary._avg.preferredSalaryMin || 0,
        ),
      },
      skills: {
        employerDemand: topEmployerSkills,
        candidateSupply: topCandidateSkills,
      },
      workArrangement: {
        employer: employerWorkArrangements,
        candidate: candidateWorkArrangements,
      },
    };
  }
}
