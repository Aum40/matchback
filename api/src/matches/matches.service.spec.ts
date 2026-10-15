import { MatchesService } from './matches.service';

type Side = { direction: 'LIKE' | 'SKIP' } | null;

function setup({
  candidateSide,
  companySide,
  inserted = 1,
  existingMatchId = 'match-1',
}: {
  candidateSide: Side;
  companySide: Side;
  /** แถวที่ createMany insert ได้จริง (0 = มีคนสร้างไปก่อนแล้ว) */
  inserted?: number;
  /** null = ยังไม่มี match ในตาราง */
  existingMatchId?: string | null;
}) {
  const prisma = {
    jobInteraction: { findUnique: jest.fn().mockResolvedValue(candidateSide) },
    candidateInteraction: {
      findUnique: jest.fn().mockResolvedValue(companySide),
    },
    match: {
      createMany: jest.fn().mockResolvedValue({ count: inserted }),
      findUnique: jest
        .fn()
        .mockResolvedValue(existingMatchId ? { id: existingMatchId } : null),
    },
  };
  return { service: new MatchesService(prisma as never), prisma };
}

const LIKE = { direction: 'LIKE' } as const;
const SKIP = { direction: 'SKIP' } as const;

describe('MatchesService.syncMatch', () => {
  it('creates the match when both sides LIKE (the request that inserts it celebrates)', async () => {
    const { service, prisma } = setup({
      candidateSide: LIKE,
      companySide: LIKE,
    });

    await expect(service.syncMatch('cand-1', 'job-001')).resolves.toEqual({
      matchCreated: true,
      isMatched: true,
      matchId: 'match-1',
    });
    expect(prisma.match.createMany).toHaveBeenCalledWith({
      data: [{ candidateId: 'cand-1', jobId: 'job-001' }],
      skipDuplicates: true,
    });
  });

  it('a concurrent or retried request sees the match but does not claim to have created it', async () => {
    const { service } = setup({
      candidateSide: LIKE,
      companySide: LIKE,
      inserted: 0,
    });

    await expect(service.syncMatch('cand-1', 'job-001')).resolves.toEqual({
      matchCreated: false,
      isMatched: true,
      matchId: 'match-1',
    });
  });

  it('only one side LIKE = no match yet, and never inserts', async () => {
    const { service, prisma } = setup({
      candidateSide: LIKE,
      companySide: null,
      existingMatchId: null,
    });

    await expect(service.syncMatch('cand-1', 'job-001')).resolves.toEqual({
      matchCreated: false,
      isMatched: false,
      matchId: null,
    });
    expect(prisma.match.createMany).not.toHaveBeenCalled();
  });

  it('a later SKIP keeps the existing match (no un-matching)', async () => {
    const { service, prisma } = setup({
      candidateSide: SKIP,
      companySide: LIKE,
    });

    await expect(service.syncMatch('cand-1', 'job-001')).resolves.toEqual({
      matchCreated: false,
      isMatched: true,
      matchId: 'match-1',
    });
    expect(prisma.match.createMany).not.toHaveBeenCalled();
  });

  it('a high score is irrelevant: SKIP on either side never creates a match', async () => {
    const { service, prisma } = setup({
      candidateSide: LIKE,
      companySide: SKIP,
      existingMatchId: null,
    });

    await expect(service.syncMatch('cand-1', 'job-001')).resolves.toMatchObject(
      { isMatched: false },
    );
    expect(prisma.match.createMany).not.toHaveBeenCalled();
  });
});

describe('MatchesService visibility', () => {
  function listSetup(companyId: string | null) {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue({ companyId }) },
      match: {
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    return { service: new MatchesService(prisma as never), prisma };
  }

  it('a candidate only sees their own matches', async () => {
    const { service, prisma } = listSetup(null);
    await service.findAllFor({ sub: 'cand-1', role: 'USER' });
    expect(prisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { candidateId: 'cand-1' } }),
    );
  });

  it("a recruiter only sees matches for their company's jobs (company read from the DB)", async () => {
    const { service, prisma } = listSetup('company-1');
    await service.findAllFor({ sub: 'rec-1', role: 'RECRUITER' });
    expect(prisma.match.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { job: { companyId: 'company-1' } } }),
    );
  });

  it('a recruiter without a company sees nothing, and another match is a 404', async () => {
    const { service, prisma } = listSetup(null);
    await expect(
      service.findAllFor({ sub: 'rec-1', role: 'RECRUITER' }),
    ).resolves.toEqual([]);
    expect(prisma.match.findMany).not.toHaveBeenCalled();
    await expect(
      service.findOneFor({ sub: 'rec-1', role: 'RECRUITER' }, 'match-x'),
    ).rejects.toMatchObject({ response: { code: 'MATCH_NOT_FOUND' } });
  });
});
