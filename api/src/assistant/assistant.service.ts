import { SendMessagesDto } from '@/assistant/dto/send-messages.dto';
import { CandidatesService } from '@/candidates/candidates.service';
import { AiService } from '@/infrastructure/ai/ai.service';
import type { AssistantContext } from '@/infrastructure/ai/ai.types';
import { MatchingService } from '@/matching/matching.service';
import { BadRequestException, Injectable } from '@nestjs/common';

/** รวมความยาวทุกข้อความ — กันประวัติแชตยาวจนกินโควตา/ค่า token (20 ข้อความ × 2,000 ยังเกินได้) */
export const MAX_TOTAL_CHARS = 20_000;

@Injectable()
export class AssistantService {
  constructor(
    private readonly matchingService: MatchingService,
    private readonly candidatesService: CandidatesService,
    private readonly aiService: AiService,
  ) {}

  async reply(userId: string, { messages, jobId }: SendMessagesDto) {
    const total = messages.reduce((sum, m) => sum + m.content.length, 0);
    if (total > MAX_TOTAL_CHARS) {
      throw new BadRequestException({
        message: 'This conversation is too long. Start a new chat.',
        code: 'ASSISTANT_INPUT_TOO_LARGE',
      });
    }
    // model ต้องตอบ "ข้อความล่าสุดของผู้ใช้" — จบด้วยคำตอบของ Bot = ไม่มีอะไรให้ตอบ
    if (messages[messages.length - 1].role !== 'user') {
      throw new BadRequestException({
        message: 'The last message must come from the user',
        code: 'ASSISTANT_LAST_MESSAGE_NOT_USER',
      });
    }

    return this.aiService.chat(
      await this.buildContext(userId, jobId),
      messages,
    );
  }

  /**
   * มี jobId = ใช้ context ชุดเดียวกับหน้าวิเคราะห์ match (งานต้อง PUBLISHED ไม่งั้น 404 JOB_NOT_FOUND)
   * ไม่มี = โปรไฟล์ของผู้ถามอย่างเดียว
   */
  private async buildContext(
    userId: string,
    jobId?: string,
  ): Promise<AssistantContext> {
    if (jobId) {
      const { context } = await this.matchingService.buildContext(
        userId,
        jobId,
      );
      return context;
    }
    const { facts } = await this.candidatesService.getMatchInputs(userId);
    return { candidate: facts, job: null, match: null };
  }
}
