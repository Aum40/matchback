import { calculateMatch } from '@/matching/match-score';
import {
  COMPANIES,
  DEMO_CANDIDATE_2,
  DEMO_CANDIDATE_POOL,
  DEMO_PROFILE,
  DEMO_RECRUITER,
  DEMO_RECRUITER_PRESET_LIKES,
  JOBS,
  SKILLS,
} from '../../prisma/seed-data';

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

  // seed จับคู่งานกับบริษัทด้วยชื่อ: ชื่อไม่ตรงตัวเดียว = งานไม่มีเจ้าของ recruiter จัดการไม่ได้
  it('gives every demo job a demo company by exact name', () => {
    const names = new Set<string>(COMPANIES.map((company) => company.name));
    expect(JOBS.every((job) => names.has(job.company))).toBe(true);
    expect(COMPANIES.every((company) => company.name.endsWith('(demo)'))).toBe(
      true,
    );
    expect(new Set(COMPANIES.map((company) => company.id)).size).toBe(
      COMPANIES.length,
    );
  });

  // สคริปต์เดโม: recruiter LIKE ผู้สมัครคนที่สองใน job-001 แล้วต้องเกิด match จริงทันที
  it('demo recruiter owns the job the second candidate already liked', () => {
    const recruiterCompany = COMPANIES.find(
      (company) => company.id === DEMO_RECRUITER.companyId,
    );
    for (const jobId of DEMO_CANDIDATE_2.likedJobIds) {
      const job = JOBS.find((item) => item.id === jobId);
      expect(job?.company).toBe(recruiterCompany?.name);
    }
    expect(DEMO_CANDIDATE_2.skillIds.every((id) => skillIds.has(id))).toBe(
      true,
    );
  });

  // deck ของ recruiter ต้องมีการ์ดพอให้กรรมการหลายคนลอง และข้อมูลต้องถูกต้องไม่งั้น seed ล้ม
  it('seeds a pool of valid, clearly fictional candidates', () => {
    expect(DEMO_CANDIDATE_POOL.length).toBeGreaterThanOrEqual(5);
    const emails = DEMO_CANDIDATE_POOL.map((candidate) => candidate.email);
    expect(new Set(emails).size).toBe(emails.length);
    const jobIds = new Set(JOBS.map((job) => job.id));
    for (const candidate of DEMO_CANDIDATE_POOL) {
      // example.com สงวนไว้ ส่งอีเมลจริงไม่ได้ และไม่ชนกับบัญชีเดโมที่ล็อกอินได้
      expect(candidate.email.endsWith('@example.com')).toBe(true);
      expect(candidate.name.endsWith(' Demo')).toBe(true);
      expect(candidate.skillIds.length).toBeGreaterThan(0);
      expect(candidate.skillIds.every((id) => skillIds.has(id))).toBe(true);
      expect(new Set(candidate.skillIds).size).toBe(candidate.skillIds.length);
      expect(candidate.likedJobIds.every((id) => jobIds.has(id))).toBe(true);
    }
  });

  // กด LIKE ล่วงหน้าได้เฉพาะงานของบริษัท recruiter เดโมเอง (เหมือนกฎของ API)
  it('presets recruiter likes only on the demo recruiter company jobs', () => {
    const recruiterCompany = COMPANIES.find(
      (company) => company.id === DEMO_RECRUITER.companyId,
    );
    for (const { jobId } of DEMO_RECRUITER_PRESET_LIKES) {
      const job = JOBS.find((item) => item.id === jobId);
      expect(job?.company).toBe(recruiterCompany?.name);
    }
  });
});
