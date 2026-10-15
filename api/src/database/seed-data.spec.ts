import { calculateMatch } from '@/matching/match-score';
import { DEMO_PROFILE, JOBS, SKILLS } from '../../prisma/seed-data';

/** seed ผิด = migrate reset ล้มกลางเดโม จับให้ได้ตั้งแต่ใน CI */
describe('seed data', () => {
  const skillIds = new Set(SKILLS.map((skill) => skill.id));

  it('has 10-20 demo jobs with unique ids', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(10);
    expect(JOBS.length).toBeLessThanOrEqual(20);
    expect(new Set(JOBS.map((job) => job.id)).size).toBe(JOBS.length);
  });

  it('only references skills that exist, without duplicates per job', () => {
    for (const job of JOBS) {
      const all = [...job.required, ...job.niceToHave];
      expect(all.every((id) => skillIds.has(id))).toBe(true);
      expect(new Set(all).size).toBe(all.length);
      expect(job.required.length).toBeGreaterThan(0);
    }
  });

  it('marks every company as demo data', () => {
    expect(JOBS.every((job) => job.company.endsWith('(demo)'))).toBe(true);
  });

  it('keeps salary ranges ordered', () => {
    for (const job of JOBS) {
      if (job.salaryMin !== null && job.salaryMax !== null) {
        expect(job.salaryMin).toBeLessThanOrEqual(job.salaryMax);
      }
    }
  });

  // เดโมพึ่งเคสนี้: โปรไฟล์ตัวอย่างต้องโชว์ครบทั้ง matched / unconfirmed / missing
  it('demo profile shows matched, unconfirmed and missing skills on a showcase job', () => {
    const job = JOBS.find((item) => item.id === 'job-002')!;
    const result = calculateMatch(
      {
        skillIds: DEMO_PROFILE.skillIds,
        profileText: [DEMO_PROFILE.experience, DEMO_PROFILE.projects].join(
          '\n',
        ),
        desiredRoles: DEMO_PROFILE.desiredRoles,
        preferredSalaryMin: DEMO_PROFILE.preferredSalaryMin,
        preferredWorkArrangement: DEMO_PROFILE.preferredWorkArrangement,
      },
      {
        title: job.title,
        workArrangement: job.workArrangement,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        skills: [
          ...job.required.map((id) => ({
            id,
            name: SKILLS.find((s) => s.id === id)!.name,
            required: true,
          })),
          ...job.niceToHave.map((id) => ({
            id,
            name: SKILLS.find((s) => s.id === id)!.name,
            required: false,
          })),
        ],
      },
    );

    expect(result.matchedSkills.map((s) => s.id)).toContain('react');
    expect(result.unconfirmedSkills.map((s) => s.id)).toEqual(
      expect.arrayContaining(['typescript', 'nextjs']),
    );
    expect(result.missingSkills.length).toBeGreaterThan(0);
  });
});
