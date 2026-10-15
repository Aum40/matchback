import type { MatchResult } from '@/matching/match-score';
import z from 'zod';

/**
 * ข้อมูลโปรไฟล์ที่ส่งให้ AI — ตั้งใจไม่มีชื่อ อีเมล หรือ id ของผู้ใช้
 * ส่งเฉพาะสิ่งที่ต้องใช้อธิบายผล (ข้อมูลส่วนตัวออกนอกระบบให้น้อยที่สุด)
 */
export type CandidateFacts = {
  headline: string | null;
  education: string | null;
  experience: string | null;
  projects: string | null;
  desiredRoles: string[];
  skills: string[];
};

export type JobFacts = {
  title: string;
  company: string;
  description: string;
};

export type MatchContext = {
  candidate: CandidateFacts;
  job: JobFacts;
  /** คะแนนจาก calculateMatch() — AI อธิบายได้ แต่ห้ามคำนวณใหม่ */
  match: MatchResult;
};

export type AiSource = 'ai' | 'fallback';

// schema เดียวกันใช้ทั้งบังคับรูปแบบคำตอบของ AI (structured output)
// และเป็นรูปร่างของ fallback ฝั่งเว็บจึงเจอข้อมูลหน้าตาเดียวกันเสมอ
export const matchExplanationSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
  nextSteps: z.array(z.string()),
});

export const resumeCoachingSchema = z.object({
  emphasize: z.array(z.string()),
  bulletSuggestions: z.array(
    z.object({
      /** ข้อความเดิมจากโปรไฟล์ที่ควรปรับ null = ข้อเสนอใหม่จากข้อมูลที่มีอยู่ */
      original: z.string().nullable(),
      suggestion: z.string(),
      reason: z.string(),
    }),
  ),
  highlight: z.array(z.string()),
  /** สิ่งที่ผู้สมัครยังไม่ได้แสดงหลักฐาน — ห้ามแนะนำให้เขียนว่ามีทั้งที่ไม่มี */
  cautions: z.array(z.string()),
});

export type MatchExplanation = z.infer<typeof matchExplanationSchema> & {
  source: AiSource;
};
export type ResumeCoaching = z.infer<typeof resumeCoachingSchema> & {
  source: AiSource;
};

/** ข้อความหนึ่งในแชต MATCHBACK Bot (ประวัติแชตมาจากเว็บทุกครั้ง ไม่เก็บใน DB) */
export type ChatMessage = { role: 'user' | 'assistant'; content: string };

/**
 * ข้อมูลที่ Bot เห็น: โปรไฟล์ของผู้ถามเอง + งานที่กำลังดู (ถ้ามี) เท่านั้น
 * ไม่มีอีเมล/ชื่อ/id ผู้ใช้ ไม่มีข้อมูลผู้สมัครคนอื่น และไม่มีการตัดสินใจของบริษัท
 */
export type AssistantContext = {
  candidate: CandidateFacts;
  job: JobFacts | null;
  match: MatchResult | null;
};

export const assistantReplySchema = z.object({ reply: z.string().min(1) });

export type AssistantReply = z.infer<typeof assistantReplySchema> & {
  source: AiSource;
};
