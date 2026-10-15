import {
  calculateMatch,
  MatchCandidate,
  MatchJob,
  mentions,
  roleFit,
  salaryFit,
  workArrangementFit,
} from './match-score';

const job: MatchJob = {
  title: 'Junior Frontend Developer',
  workArrangement: 'HYBRID',
  salaryMin: 30000,
  salaryMax: 45000,
  skills: [
    { id: 'react', name: 'React', required: true },
    { id: 'typescript', name: 'TypeScript', required: true },
    { id: 'css', name: 'CSS', required: true },
    { id: 'testing', name: 'Testing', required: false },
  ],
};

const candidate = (
  overrides: Partial<MatchCandidate> = {},
): MatchCandidate => ({
  skillIds: ['react', 'typescript', 'css', 'testing'],
  profileText: '',
  desiredRoles: ['Frontend Developer'],
  preferredSalaryMin: 35000,
  preferredWorkArrangement: 'HYBRID',
  ...overrides,
});

describe('calculateMatch', () => {
  it('is 100 when every skill and preference matches', () => {
    expect(calculateMatch(candidate(), job).score).toBe(100);
  });

  it('is deterministic for the same input', () => {
    const input = candidate({ skillIds: ['react'] });
    expect(calculateMatch(input, job)).toEqual(calculateMatch(input, job));
  });

  it('weights required skills (70) above nice-to-have (15)', () => {
    const noNice = calculateMatch(
      candidate({ skillIds: ['react', 'typescript', 'css'] }),
      job,
    );
    const missingOneRequired = calculateMatch(
      candidate({ skillIds: ['react', 'typescript', 'testing'] }),
      job,
    );
    expect(noNice.score).toBe(85);
    expect(missingOneRequired.score).toBeLessThan(noNice.score);
    expect(missingOneRequired.breakdown.required).toBeCloseTo(46.7, 1);
  });

  it('separates confirmed gaps from skills that are only mentioned in the profile', () => {
    const result = calculateMatch(
      candidate({
        skillIds: ['react'],
        profileText: 'Built a TypeScript dashboard for a student club',
      }),
      job,
    );

    expect(result.matchedSkills.map((s) => s.id)).toEqual(['react']);
    expect(result.unconfirmedSkills).toEqual([
      expect.objectContaining({
        id: 'typescript',
        reason: 'MENTIONED_IN_PROFILE',
      }),
    ]);
    expect(result.missingSkills.map((s) => s.id)).toEqual(['css', 'testing']);
  });

  it('does not count mentioned-but-unlisted skills toward the score', () => {
    const listedOnly = calculateMatch(candidate({ skillIds: ['react'] }), job);
    const alsoMentioned = calculateMatch(
      candidate({ skillIds: ['react'], profileText: 'TypeScript and CSS' }),
      job,
    );
    expect(alsoMentioned.score).toBe(listedOnly.score);
  });

  it('treats an empty skill list as missing information, not as gaps', () => {
    const result = calculateMatch(candidate({ skillIds: [] }), job);

    expect(result.missingSkills).toEqual([]);
    expect(result.unconfirmedSkills).toHaveLength(4);
    expect(
      result.unconfirmedSkills.every((s) => s.reason === 'NO_SKILLS_LISTED'),
    ).toBe(true);
  });

  it('gives neutral preference points when the profile is blank', () => {
    const result = calculateMatch(
      candidate({
        desiredRoles: [],
        preferredSalaryMin: null,
        preferredWorkArrangement: null,
      }),
      job,
    );
    expect(result.preferenceFit).toEqual({
      workArrangement: 0.5,
      salary: 0.5,
      role: 0.5,
    });
    expect(result.breakdown.preferences).toBe(7.5);
  });

  it('gives full skill ratios to a job that lists no skills', () => {
    const result = calculateMatch(candidate(), { ...job, skills: [] });
    expect(result.breakdown.required).toBe(70);
    expect(result.breakdown.niceToHave).toBe(15);
  });

  it('always stays within 0-100', () => {
    const worst = calculateMatch(
      candidate({
        skillIds: ['unrelated'],
        desiredRoles: ['Accountant'],
        preferredSalaryMin: 999999,
        preferredWorkArrangement: 'REMOTE',
      }),
      { ...job, workArrangement: 'ONSITE' },
    );
    expect(worst.score).toBe(0);
  });
});

describe('preference helpers', () => {
  it('workArrangementFit: exact 1, hybrid on either side 0.5, opposite 0', () => {
    expect(workArrangementFit('REMOTE', 'REMOTE')).toBe(1);
    expect(workArrangementFit('REMOTE', 'HYBRID')).toBe(0.5);
    expect(workArrangementFit('REMOTE', 'ONSITE')).toBe(0);
    expect(workArrangementFit(null, 'ONSITE')).toBe(0.5);
  });

  it('salaryFit compares the top of the range with the expected minimum', () => {
    expect(salaryFit(40000, { salaryMin: 30000, salaryMax: 45000 })).toBe(1);
    expect(salaryFit(50000, { salaryMin: 30000, salaryMax: 45000 })).toBe(0);
    expect(salaryFit(40000, { salaryMin: null, salaryMax: null })).toBe(0.5);
  });

  it('roleFit ignores seniority words and takes the closest desired role', () => {
    expect(roleFit(['Frontend Developer'], 'Junior Frontend Developer')).toBe(
      1,
    );
    expect(
      roleFit(['Backend Developer', 'Data Analyst'], 'Frontend Developer'),
    ).toBe(0.5);
    expect(roleFit([], 'Anything')).toBe(0.5);
  });

  it('mentions matches whole words only', () => {
    expect(mentions('I write JavaScript daily', 'Java')).toBe(false);
    expect(mentions('Java and Spring', 'Java')).toBe(true);
    expect(mentions('Used C++ for robotics', 'C++')).toBe(true);
    expect(mentions('Node.js APIs', 'Node.js')).toBe(true);
  });
});
