import { EnvVariable } from '@/config/env.validation';
import {
  ApiError,
  FinishReason,
  GoogleGenAI,
  ThinkingLevel,
} from '@google/genai';
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

/**
 * JSON Schema จาก zod มี "$schema" (URL ของ draft) ติดมาด้วย ซึ่ง Gemini ไม่จำเป็นต้องใช้
 * และอาจปฏิเสธคำขอ ตัดทิ้งก่อนส่ง — ถ้าโดนปฏิเสธจริงจะตกไป fallback ทุกครั้งแบบเงียบ ๆ
 */
function toGeminiSchema(schema: z.ZodType): Record<string, unknown> {
  const { $schema: _draft, ...rest } = z.toJSONSchema(schema);
  return rest;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client?: GoogleGenAI;
  private readonly model: string;

  constructor(configService: ConfigService<EnvVariable, true>) {
    this.model = configService.get('AI_MODEL', { infer: true });
    const apiKey = configService.get('GEMINI_API_KEY', { infer: true });

    // ส่ง key เข้าไปตรง ๆ: ไม่มีใน .env = ปิด AI ชัดเจน
    // (ถ้าปล่อย SDK หาเอง มันจะไปอ่าน GOOGLE_API_KEY/GEMINI_API_KEY จาก environment
    // ของเครื่อง dev เอง แล้วพฤติกรรมไม่ตรงกับที่ env.validation ตรวจไว้)
    if (apiKey) {
      this.client = new GoogleGenAI({
        apiKey,
        // ตอบช้าแล้วยังมี fallback รองรับ ไม่ต้องรอนานให้ผู้ใช้ค้าง
        httpOptions: {
          timeout: configService.get('AI_TIMEOUT_MS', { infer: true }),
        },
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
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: `${task}\n\n<context>\n${JSON.stringify(context, null, 2)}\n</context>`,
        config: {
          systemInstruction: RULES,
          // บังคับให้ตอบเป็น JSON ตาม schema เดียวกับที่ fallback ใช้
          responseMimeType: 'application/json',
          responseJsonSchema: toGeminiSchema(schema),
          // งานสั้น ไม่ซับซ้อน: คิดน้อยพอ ตอบเร็วกว่าและไม่กินโควตาฟรี
          // (thinking token นับรวมใน maxOutputTokens ด้วย ตั้งต่ำไปคำตอบจะถูกตัดกลางคัน)
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 4096,
        },
      });

      const blocked = response.promptFeedback?.blockReason;
      const finishReason = response.candidates?.[0]?.finishReason;
      if (blocked || (finishReason && finishReason !== FinishReason.STOP)) {
        this.logger.warn(
          `${label}: AI did not finish (blockReason=${blocked ?? '-'}, finishReason=${finishReason ?? '-'}), using fallback`,
        );
        return null;
      }

      // structured output ช่วยให้ได้ JSON แต่ไม่รับประกันทุกครั้ง ต้องตรวจด้วย zod ซ้ำเสมอ
      const parsed = schema.safeParse(JSON.parse(response.text ?? ''));
      if (!parsed.success) {
        this.logger.warn(
          `${label}: AI output did not match the schema, using fallback`,
        );
        return null;
      }
      return parsed.data;
    } catch (error) {
      // ไม่ส่ง error ต่อให้ผู้ใช้: AI เป็นส่วนเสริม หน้าจอต้องใช้งานได้เสมอ
      // (รวม 429 ตอนโควตาฟรีหมด และ JSON ที่ parse ไม่ได้)
      if (error instanceof ApiError) {
        this.logger.error(
          `${label}: Gemini API ${error.status} error, using fallback — ${error.message}`,
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
