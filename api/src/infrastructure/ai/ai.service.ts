import { EnvVariable } from '@/config/env.validation';
import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import z from 'zod';
import { fallbackCoaching, fallbackExplanation } from './ai.fallback';
import {
  MatchContext,
  matchExplanationSchema,
  MatchExplanation,
  resumeCoachingSchema,
  ResumeCoaching,
} from './ai.types';

/**
 * กติกาที่ใช้กับทุกคำขอ — แก้ที่นี่ที่เดียว
 * หลักคือ AI "อธิบายและแนะนำ" จากข้อมูลที่ให้ไป ห้ามสร้างข้อมูลใหม่หรือให้คะแนนเอง
 */
const RULES = `You help early-career job seekers in a job-matching app called MATCHBACK.

Rules you must always follow:
- Use only the facts given in the candidate profile. Never invent or assume experience, skills, achievements, employers, numbers, or qualifications.
- The match score was calculated by deterministic code. Explain it; never recalculate, change, or second-guess the number, and never describe it as a probability of being hired or of getting a response.
- "Unconfirmed" skills mean the profile does not give enough information. Treat them as missing information to clarify, not as skill gaps.
- Never promise or imply that an employer will respond, interview, or hire.
- Be specific, encouraging, and concise. Plain English, no markdown.`;

const EXPLAIN_TASK = `Explain this match to the candidate.
- summary: 1-2 sentences.
- strengths: what in their profile fits the role.
- gaps: confirmed missing skills, then unconfirmed ones phrased as missing information.
- nextSteps: 2-4 concrete actions that would make their application stronger.`;

const COACH_TASK = `Coach the candidate on tailoring their resume for this job.
- emphasize: skills and achievements already in their profile to put first.
- bulletSuggestions: rewrite weak lines from their experience or projects (quote the original) into stronger resume bullets, using only facts they gave. Do not add numbers they did not provide; suggest where they could add a real metric instead.
- highlight: experience or projects from their profile that are relevant to this job.
- cautions: required skills they have not shown, with a reminder not to claim them without real experience.`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client?: Anthropic;
  private readonly model: string;

  constructor(configService: ConfigService<EnvVariable, true>) {
    this.model = configService.get('AI_MODEL', { infer: true });
    const apiKey = configService.get('ANTHROPIC_API_KEY', { infer: true });

    // ส่ง key เข้าไปตรง ๆ: ไม่มีใน .env = ปิด AI ชัดเจน
    // (ถ้าปล่อย SDK หาเอง มันจะไปใช้ credential อื่นในเครื่อง dev แล้วพฤติกรรมไม่ตรงกับ production)
    if (apiKey) {
      this.client = new Anthropic({
        apiKey,
        timeout: configService.get('AI_TIMEOUT_MS', { infer: true }),
        // ตอบช้าแล้วยังมี fallback รองรับ ไม่ต้องลองซ้ำหลายรอบให้ผู้ใช้รอ
        maxRetries: 1,
      });
    }
  }

  get enabled(): boolean {
    return this.client !== undefined;
  }

  async explainMatch(context: MatchContext): Promise<MatchExplanation> {
    const result = await this.generate(
      matchExplanationSchema,
      EXPLAIN_TASK,
      context,
      'explainMatch',
    );
    return result ? { ...result, source: 'ai' } : fallbackExplanation(context);
  }

  async coachResume(context: MatchContext): Promise<ResumeCoaching> {
    const result = await this.generate(
      resumeCoachingSchema,
      COACH_TASK,
      context,
      'coachResume',
    );
    return result ? { ...result, source: 'ai' } : fallbackCoaching(context);
  }

  /** คืน null ทุกกรณีที่ใช้คำตอบของ AI ไม่ได้ ผู้เรียกจะใช้ fallback แทน */
  private async generate<T>(
    schema: z.ZodType<T>,
    task: string,
    context: MatchContext,
    label: string,
  ): Promise<T | null> {
    if (!this.client) return null;

    try {
      const response = await this.client.beta.messages.parse({
        model: this.model,
        max_tokens: 16000,
        // งานสั้น ไม่ซับซ้อน: effort ต่ำพอ ตอบเร็วกว่าและถูกกว่า
        output_config: {
          effort: 'low',
          format: betaZodOutputFormat(schema),
        },
        // ถ้าโมเดลหลักปฏิเสธ (safety classifier) ให้ API ลองโมเดลสำรองให้เองในคำขอเดียว
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system: RULES,
        messages: [
          {
            role: 'user',
            content: `${task}\n\n<context>\n${JSON.stringify(context, null, 2)}\n</context>`,
          },
        ],
      });

      if (response.stop_reason === 'refusal') {
        this.logger.warn(
          `${label}: AI declined (${response.stop_details?.category ?? 'unknown'}), using fallback`,
        );
        return null;
      }
      if (!response.parsed_output) {
        this.logger.warn(
          `${label}: no parsable output (stop_reason=${response.stop_reason}), using fallback`,
        );
        return null;
      }
      return response.parsed_output;
    } catch (error) {
      // ไม่ส่ง error ต่อให้ผู้ใช้: AI เป็นส่วนเสริม หน้าจอต้องใช้งานได้เสมอ
      if (error instanceof Anthropic.APIError) {
        this.logger.error(
          `${label}: Claude API ${error.status ?? 'connection'} error, using fallback — ${error.message}`,
        );
      } else {
        this.logger.error(
          `${label}: unexpected AI error, using fallback`,
          error,
        );
      }
      return null;
    }
  }
}
