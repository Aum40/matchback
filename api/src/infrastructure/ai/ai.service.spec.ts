import { ApiError } from '@google/genai';
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
      ({ AI_MODEL: 'gemini-3.8-flash', AI_TIMEOUT_MS: 30000, ...env })[key],
  };
  return new AiService(config as never);
}

/** แทน client จริงด้วยของปลอม — test ไม่เรียก API และไม่เสียเงิน */
function withFakeClient(service: AiService, generateContent: jest.Mock) {
  Object.assign(service, { client: { models: { generateContent } } });
  return service;
}

/** รูปคำตอบของ Gemini ที่ AiService อ่าน: ข้อความ JSON + เหตุผลที่หยุด */
const geminiReply = (body: unknown, finishReason = 'STOP') => ({
  text: typeof body === 'string' ? body : JSON.stringify(body),
  candidates: [{ finishReason }],
});

describe('AiService', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  it('is disabled and uses the deterministic fallback without an API key', async () => {
    const service = serviceWith({ GEMINI_API_KEY: undefined });

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
      jest.fn().mockResolvedValue(geminiReply(parsed)),
    );

    await expect(service.explainMatch(context)).resolves.toEqual({
      ...parsed,
      source: 'ai',
    });
  });

  it('falls back when the prompt is blocked by safety filters', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest.fn().mockResolvedValue({
        text: undefined,
        promptFeedback: { blockReason: 'SAFETY' },
        candidates: [],
      }),
    );

    await expect(service.explainMatch(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });

  it('falls back when the answer was cut off (thinking + output hit the token cap)', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest
        .fn()
        .mockResolvedValue(geminiReply('{"summary": "half', 'MAX_TOKENS')),
    );

    await expect(service.explainMatch(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });

  it('falls back when the JSON does not match the schema', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest.fn().mockResolvedValue(geminiReply({ summary: 'only this' })),
    );

    await expect(service.explainMatch(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });

  it('asks Gemini for JSON with the shared schema and the rules prompt', async () => {
    const generateContent = jest
      .fn()
      .mockResolvedValue(
        geminiReply({ summary: 's', strengths: [], gaps: [], nextSteps: [] }),
      );
    await withFakeClient(serviceWith({}), generateContent).explainMatch(
      context,
    );

    const [request] = generateContent.mock.calls[0] as [
      {
        model: string;
        config: { responseMimeType: string; systemInstruction: string };
      },
    ];
    expect(request.model).toBe('gemini-3.8-flash');
    expect(request.config.responseMimeType).toBe('application/json');
    expect(request.config.systemInstruction).toContain('Never invent');
  });

  it('falls back when the API errors instead of failing the request', async () => {
    const service = withFakeClient(
      serviceWith({}),
      jest
        .fn()
        .mockRejectedValue(
          new ApiError({ message: 'quota exceeded', status: 429 }),
        ),
    );

    await expect(service.coachResume(context)).resolves.toMatchObject({
      source: 'fallback',
    });
  });

  describe('chat (MATCHBACK Bot)', () => {
    const messages = [
      { role: 'user' as const, content: 'Am I ready for this job?' },
      { role: 'assistant' as const, content: 'Mostly, yes.' },
      { role: 'user' as const, content: 'What should I learn first?' },
    ];
    const chatContext = { ...context };

    it('falls back to a context-based reply without an API key', async () => {
      const result = await serviceWith({}).chat(chatContext, messages);

      expect(result.source).toBe('fallback');
      expect(result.reply).toContain(`${context.match.score}/100`);
      expect(result.reply).toContain('not available');
    });

    it('fallback without a job points the candidate to open one', async () => {
      const result = await serviceWith({}).chat(
        { candidate: context.candidate, job: null, match: null },
        messages,
      );
      expect(result.reply).toContain('React');
      expect(result.reply).toContain('Open a job');
    });

    it('sends the conversation as turns, context only in the system prompt, capped at 1,200 tokens', async () => {
      const generateContent = jest
        .fn()
        .mockResolvedValue(geminiReply({ reply: 'Start with TypeScript.' }));
      const result = await withFakeClient(
        serviceWith({}),
        generateContent,
      ).chat(chatContext, messages);

      expect(result).toEqual({ reply: 'Start with TypeScript.', source: 'ai' });
      expect(generateContent).toHaveBeenCalledTimes(1);
      const [request] = generateContent.mock.calls[0] as [
        {
          contents: { role: string; parts: { text: string }[] }[];
          config: { systemInstruction: string; maxOutputTokens: number };
        },
      ];
      expect(request.contents.map((turn) => turn.role)).toEqual([
        'user',
        'model',
        'user',
      ]);
      expect(request.config.maxOutputTokens).toBe(1200);
      expect(request.config.systemInstruction).toContain('MATCHBACK Bot');
      expect(request.config.systemInstruction).toContain('Frontend Developer');
      expect(JSON.stringify(request.contents)).not.toContain('<context>');
    });

    it('falls back when the reply is empty or cut off', async () => {
      for (const reply of [
        geminiReply({ reply: '' }),
        geminiReply('{"reply": "half', 'MAX_TOKENS'),
      ]) {
        const service = withFakeClient(
          serviceWith({}),
          jest.fn().mockResolvedValue(reply),
        );
        await expect(
          service.chat(chatContext, messages),
        ).resolves.toMatchObject({ source: 'fallback' });
      }
    });
  });
});
