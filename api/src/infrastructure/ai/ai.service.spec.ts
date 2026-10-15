import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '@nestjs/common';
import { calculateMatch } from '@/matching/match-score';
import { AiService } from './ai.service';
import type { MatchContext } from './ai.types';

const context: MatchContext = {
  candidate: {
    headline: null,
    education: null,
    experience: 'Built a TypeScript dashboard',
    projects: null,
    desiredRoles: ['Frontend Developer'],
    skills: ['React'],
  },
  job: {
    title: 'Frontend Developer',
    company: 'Demo Co (demo)',
    description: '...',
  },
  match: calculateMatch(
    {
      skillIds: ['react'],
      profileText: 'Built a TypeScript dashboard',
      desiredRoles: ['Frontend Developer'],
      preferredSalaryMin: null,
      preferredWorkArrangement: null,
    },
    {
      title: 'Frontend Developer',
      workArrangement: 'REMOTE',
      salaryMin: null,
      salaryMax: null,
      skills: [
        { id: 'react', name: 'React', required: true },
        { id: 'typescript', name: 'TypeScript', required: true },
        { id: 'css', name: 'CSS', required: true },
      ],
    },
  ),
};

function serviceWith(env: Record<string, unknown>) {
  const config = {
    get: (key: string) =>
      ({ AI_MODEL: 'claude-opus-5-5', AI_TIMEOUT_MS: 30000, ...env })[key],
  };
  return new AiService(config as never);
}

/** แทน client จริงด้วยของปลอม — test ไม่เรียก API และไม่เสียเงิน */
function withFakeClient(service: AiService, parse: jest.Mock) {
  Object.assign(service, { client: { beta: { messages: { parse } } } });
  return service;
}

describe('AiService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('is disabled and uses the deterministic fallback without an API key', async () => {
    const service = serviceWith({ ANTHROPIC_API_KEY: undefined });

    expect(service.enabled).toBe(false);
    const result = await service.explainMatch(context);
    expect(result.source).toBe('fallback');
    expect(result.summary).toContain(`${context.match.score}/100`);
    expect(result.summary).toContain('not a prediction');
  });

  it('fallback keeps unconfirmed skills apart from confirmed gaps', async () => {
    const result = await serviceWith({}).explainMatch(context);

    expect(result.gaps.join(' ')).toContain(
      'Required skills not shown in your profile: CSS',
    );
    expect(result.gaps.join(' ')).toContain(
      'Not enough information about: TypeScript',
    );
    expect(result.nextSteps.join(' ')).toContain('mentions TypeScript');
  });

  it('fallback coaching never suggests claiming missing skills', async () => {
    const result = await serviceWith({}).coachResume(context);

    expect(result.source).toBe('fallback');
    expect(result.cautions).toEqual([
      'Do not claim CSS unless you have real experience with it.',
    ]);
  });

  it('returns the parsed AI output with source "ai"', async () => {
    const parsed = {
      summary: 's',
      strengths: ['a'],
      gaps: [],
      nextSteps: ['n'],
    };
    const service = withFakeClient(
      serviceWith({}),
      jest
        .fn()
        .mockResolvedValue({ stop_reason: 'end_turn', parsed_output: parsed }),
    );

    await expect(service.explainMatch(context)).resolves.toEqual({
      ...parsed,
      source: 'ai',
    });
  });

  it('falls back when the model refuses', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest.fn().mockResolvedValue({
        stop_reason: 'refusal',
        stop_details: { category: null },
        parsed_output: null,
      }),
    );

    await expect(service.explainMatch(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });

  it('falls back when the API errors instead of failing the request', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest
        .fn()
        .mockRejectedValue(
          new Anthropic.APIConnectionTimeoutError({ message: 'timed out' }),
        ),
    );

    await expect(service.coachResume(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });
});
