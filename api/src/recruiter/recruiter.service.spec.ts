import { ConflictException, NotFoundException } from '@nestjs/common';
import { RecruiterService } from './recruiter.service';

const COMPANY = { id: 'company-1', name: 'North Star Labs', isDemo: false };

const publishedJob = {
  id: 'job-001',
  title: 'Frontend Developer',
  company: 'North Star Labs',
  location: 'Bangkok',
  workArrangement: 'HYBRID',
  employmentType: 'FULL_TIME',
  salaryMin: 30000,
  salaryMax: 45000,
  description: '...',
  isDemo: false,
  status: 'PUBLISHED',
  skills: [{ required: true, skill: { id: 'react', name: 'React' } }],
};

type SetupOptions = {
  job?: object | null;
  company?: object | null;
  candidates?: object[];
  candidate?: object | null;
};

function setup(options: SetupOptions = {}) {
  const {
    job = publishedJob,
    company = COMPANY,
    candidates = [],
    candidate = { id: 'cand-1' },
  } = options;
  const prisma = {
    job: {
      findFirst: jest.fn().mockResolvedValue(job),
      create: jest.fn().mockImplementation(({ data }: { data: object }) =>
        Promise.resolve({
          ...data,
          skills: [],
          _count: { candidateInteractions: 0, matches: 0 },
        }),
      ),
    },
    user: {
      findMany: jest.fn().mockResolvedValue(candidates),
      findFirst: jest.fn().mockResolvedValue(candidate),
    },
    skill: { count: jest.fn().mockResolvedValue(1) },
    candidateInteraction: { upsert: jest.fn().mockResolvedValue({}) },
  };
  const companies = {
    requireCompany: jest
      .fn()
      .mockImplementation(() =>
        company
          ? Promise.resolve(company)
          : Promise.reject(new ConflictException({ code: 'COMPANY_REQUIRED' })),
      ),
  };
  const matches = {
    syncMatch: jest.fn().mockResolvedValue({
      matchCreated: true,
      isMatched: true,
      matchId: 'match-1',
    }),
  };
  const service = new RecruiterService(
    prisma as never,
    companies as never,
    matches as never,
  );
  return { service, prisma, matches };
}

describe('RecruiterService', () => {
  describe('ownership and status', () => {
    it("another company's job looks like it doesn't exist (404, not 403)", async () => {
      const { service, prisma } = setup({ job: null });

      await expect(
        service.candidateDeck('rec-1', 'job-other'),
      ).rejects.toBeInstanceOf(NotFoundException);
      // บริษัทมาจาก DB (requireCompany) และอยู่ใน where เสมอ
      expect(prisma.job.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'job-other', companyId: 'company-1' },
        }),
      );
    });

    it('a DRAFT or CLOSED job cannot open a deck or take swipes (409 JOB_NOT_PUBLISHED)', async () => {
      const { service, prisma } = setup({
        job: { ...publishedJob, status: 'DRAFT' },
      });

      await expect(
        service.candidateDeck('rec-1', 'job-001'),
      ).rejects.toMatchObject({ response: { code: 'JOB_NOT_PUBLISHED' } });
      await expect(
        service.swipeCandidate('rec-1', 'job-001', 'cand-1', 'LIKE'),
      ).rejects.toMatchObject({ response: { code: 'JOB_NOT_PUBLISHED' } });
      expect(prisma.candidateInteraction.upsert).not.toHaveBeenCalled();
    });

    it('a recruiter without a company gets 409 COMPANY_REQUIRED', async () => {
      const { service } = setup({ company: null });
      await expect(service.listJobs('rec-1')).rejects.toMatchObject({
        response: { code: 'COMPANY_REQUIRED' },
      });
    });
  });

  describe('candidate deck privacy', () => {
    it('shows first name, profile and score only — no email, surname or the candidate decision', async () => {
      const { service, prisma } = setup({
        candidates: [
          {
            id: 'cand-1',
            name: 'Ploy Sukjai',
            profile: {
              headline: 'Frontend grad',
              education: null,
              experience: 'React projects',
              projects: null,
              desiredRoles: ['Frontend Developer'],
              preferredSalaryMin: null,
              preferredWorkArrangement: null,
            },
            skills: [{ skill: { id: 'react', name: 'React' } }],
          },
        ],
      });

      const [card] = await service.candidateDeck('rec-1', 'job-001');

      expect(card.displayName).toBe('Ploy');
      expect(card.match.score).toBeGreaterThan(0);
      expect(JSON.stringify(card)).not.toContain('Sukjai');
      expect(card).not.toHaveProperty('email');
      // ไม่ query JobInteraction ของผู้สมัครเลย และกรองคนที่บริษัทตัดสินใจแล้วออก
      const [query] = prisma.user.findMany.mock.calls[0] as [
        { where: Record<string, unknown>; select: Record<string, unknown> },
      ];
      expect(query.select).not.toHaveProperty('jobInteractions');
      expect(query.select).not.toHaveProperty('email');
      expect(query.where).toMatchObject({
        role: 'USER',
        receivedSwipes: { none: { jobId: 'job-001' } },
      });
    });
  });

  describe('swipeCandidate', () => {
    it('records one decision per job/candidate and returns the mutual-match result', async () => {
      const { service, prisma, matches } = setup();

      await expect(
        service.swipeCandidate('rec-1', 'job-001', 'cand-1', 'LIKE'),
      ).resolves.toEqual({
        jobId: 'job-001',
        direction: 'LIKE',
        matchCreated: true,
        isMatched: true,
        matchId: 'match-1',
        application: null,
      });
      expect(prisma.candidateInteraction.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            jobId_candidateId: { jobId: 'job-001', candidateId: 'cand-1' },
          },
        }),
      );
      // เช็ก match หลังบันทึกการปัดเสร็จแล้วเท่านั้น
      expect(matches.syncMatch).toHaveBeenCalledWith('cand-1', 'job-001');
    });

    it('an unknown, non-candidate or skill-less user is CANDIDATE_NOT_FOUND', async () => {
      const { service, prisma } = setup({ candidate: null });

      await expect(
        service.swipeCandidate('rec-1', 'job-001', 'rec-2', 'LIKE'),
      ).rejects.toMatchObject({ response: { code: 'CANDIDATE_NOT_FOUND' } });
      expect(prisma.candidateInteraction.upsert).not.toHaveBeenCalled();
    });
  });

  describe('createJob', () => {
    const dto = {
      title: 'Frontend Developer',
      location: 'Bangkok',
      workArrangement: 'HYBRID' as const,
      employmentType: 'FULL_TIME' as const,
      salaryMin: 30000,
      salaryMax: 45000,
      description: 'Build things',
      skills: [{ id: 'react', required: true }],
    };

    it('the API sets owner, display name, DRAFT and isDemo=false itself', async () => {
      const { service, prisma } = setup();

      await service.createJob('rec-1', dto);

      expect(prisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: 'company-1',
            company: 'North Star Labs',
            status: 'DRAFT',
            isDemo: false,
          }) as object,
        }),
      );
    });

    it('rejects duplicate skills, unknown skills and an inverted salary range', async () => {
      const { service, prisma } = setup();

      await expect(
        service.createJob('rec-1', {
          ...dto,
          skills: [
            { id: 'react', required: true },
            { id: 'react', required: false },
          ],
        }),
      ).rejects.toMatchObject({ response: { code: 'DUPLICATE_SKILL' } });

      prisma.skill.count.mockResolvedValue(0);
      await expect(service.createJob('rec-1', dto)).rejects.toMatchObject({
        response: { code: 'UNKNOWN_SKILL' },
      });

      await expect(
        service.createJob('rec-1', { ...dto, salaryMin: 50000, salaryMax: 1 }),
      ).rejects.toMatchObject({ response: { code: 'INVALID_SALARY_RANGE' } });
      expect(prisma.job.create).not.toHaveBeenCalled();
    });
  });
});
