import { AssistantService } from './assistant.service';

const facts = {
  headline: 'Frontend grad',
  education: null,
  experience: null,
  projects: null,
  desiredRoles: [],
  skills: ['React'],
};

function setup() {
  const matchingService = {
    buildContext: jest.fn().mockResolvedValue({
      job: {},
      context: { candidate: facts, job: { title: 'Dev' }, match: {} },
    }),
  };
  const candidatesService = {
    getMatchInputs: jest.fn().mockResolvedValue({ candidate: {}, facts }),
  };
  const aiService = {
    chat: jest.fn().mockResolvedValue({ reply: 'hi', source: 'ai' }),
  };
  const service = new AssistantService(
    matchingService as never,
    candidatesService as never,
    aiService as never,
  );
  return { service, matchingService, candidatesService, aiService };
}

const ask = (content: string) => [{ role: 'user' as const, content }];

describe('AssistantService', () => {
  it('rejects a conversation over 20,000 characters in total', async () => {
    const { service, aiService } = setup();
    const messages = Array.from({ length: 11 }, () => ({
      role: 'user' as const,
      content: 'x'.repeat(2000),
    }));

    await expect(service.reply('u1', { messages })).rejects.toMatchObject({
      response: { code: 'ASSISTANT_INPUT_TOO_LARGE' },
    });
    expect(aiService.chat).not.toHaveBeenCalled();
  });

  it('needs the last message to come from the user', async () => {
    const { service } = setup();
    await expect(
      service.reply('u1', {
        messages: [...ask('hi'), { role: 'assistant', content: 'hello' }],
      }),
    ).rejects.toMatchObject({
      response: { code: 'ASSISTANT_LAST_MESSAGE_NOT_USER' },
    });
  });

  it('with a jobId uses the same context as the match analysis', async () => {
    const { service, matchingService, aiService } = setup();
    await service.reply('u1', { messages: ask('fit?'), jobId: 'job-001' });

    expect(matchingService.buildContext).toHaveBeenCalledWith('u1', 'job-001');
    const [context] = aiService.chat.mock.calls[0] as [{ job: unknown }];
    expect(context.job).toEqual({ title: 'Dev' });
  });

  it('without a jobId sends only the caller profile — no email, name or ids', async () => {
    const { service, matchingService, aiService } = setup();
    await service.reply('u1', { messages: ask('help') });

    expect(matchingService.buildContext).not.toHaveBeenCalled();
    const [context] = aiService.chat.mock.calls[0] as [object];
    expect(context).toEqual({ candidate: facts, job: null, match: null });
    expect(JSON.stringify(context)).not.toMatch(/email|u1/);
  });
});
