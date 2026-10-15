import type { WorkArrangement } from '@/database/generated/prisma/enums';

/**
 * คะแนนความเข้ากันของผู้สมัครกับงาน (0-100) — ฟังก์ชันล้วน ไม่มี I/O
 * ผลเหมือนเดิมทุกครั้งที่ input เดิม จึงทดสอบได้ และ AI ห้ามคำนวณ/แก้คะแนนนี้
 * (AI ทำหน้าที่อธิบายผลเท่านั้น ดู ai/ai.service.ts)
 *
 * สูตร (เอกสารฉบับเต็มอยู่ใน docs/architecture.md → Match score):
 *   score = 70 × requiredRatio + 15 × niceToHaveRatio + 15 × preferenceFit
 *   - requiredRatio   = ทักษะ required ที่ผู้สมัคร "ยืนยัน" (ติ๊กไว้ในโปรไฟล์) / ทักษะ required ทั้งหมด
 *   - niceToHaveRatio = แบบเดียวกันสำหรับ nice-to-have
 *     (งานที่ไม่มีทักษะประเภทนั้นเลย ratio = 1 ไม่ลงโทษงานที่ประกาศสั้น)
 *   - preferenceFit   = ค่าเฉลี่ยของ workArrangement, salary, role (แต่ละตัว 0..1)
 *     ข้อมูลไม่พอ (ผู้สมัครหรืองานไม่ได้ระบุ) = 0.5 เป็นกลาง ไม่บวกไม่ลบ
 *
 * คะแนนนี้ไม่ใช่โอกาสได้งาน ห้ามแสดงเป็น % ความน่าจะเป็น
 */
export const WEIGHTS = { required: 70, niceToHave: 15, preferences: 15 };

/** ข้อมูลไม่พอให้ตัดสิน: ไม่บวกไม่ลบ */
const NEUTRAL = 0.5;

export type MatchCandidate = {
  skillIds: string[];
  /** ประสบการณ์ + โปรเจกต์ + การศึกษา รวมเป็นข้อความเดียว ใช้หาทักษะที่พูดถึงแต่ไม่ได้ติ๊ก */
  profileText: string;
  desiredRoles: string[];
  preferredSalaryMin: number | null;
  preferredWorkArrangement: WorkArrangement | null;
};

export type MatchJob = {
  title: string;
  workArrangement: WorkArrangement;
  salaryMin: number | null;
  salaryMax: number | null;
  skills: { id: string; name: string; required: boolean }[];
};

export type SkillRef = { id: string; name: string; required: boolean };

/**
 * ทักษะที่ยังสรุปไม่ได้ (ข้อมูลไม่พอ) — ต่างจาก missingSkills ที่เป็นช่องว่างจริง
 * - MENTIONED_IN_PROFILE: มีคำนี้ในประสบการณ์/โปรเจกต์ แต่ไม่ได้ติ๊กเป็นทักษะ
 * - NO_SKILLS_LISTED: ผู้สมัครยังไม่ติ๊กทักษะเลยสักตัว จึงบอกไม่ได้ว่าขาดจริง
 */
export type UnconfirmedSkill = SkillRef & {
  reason: 'MENTIONED_IN_PROFILE' | 'NO_SKILLS_LISTED';
};

export type MatchResult = {
  score: number;
  breakdown: { required: number; niceToHave: number; preferences: number };
  matchedSkills: SkillRef[];
  unconfirmedSkills: UnconfirmedSkill[];
  /** ผู้สมัครมีรายการทักษะแล้ว แต่ไม่มีทักษะนี้ทั้งในรายการและในข้อความโปรไฟล์ */
  missingSkills: SkillRef[];
  preferenceFit: { workArrangement: number; salary: number; role: number };
};

const ROLE_STOPWORDS = new Set([
  'junior',
  'senior',
  'intern',
  'internship',
  'and',
  'the',
  'of',
  'a',
]);

function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((token) => token.length > 0 && !ROLE_STOPWORDS.has(token));
}

/** หาคำแบบทั้งคำ ไม่สนตัวพิมพ์ — "Java" ต้องไม่ไปเจอใน "JavaScript" */
export function mentions(text: string, skillName: string): boolean {
  const escaped = skillName
    .toLowerCase()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9+#])${escaped}($|[^a-z0-9+#])`).test(
    text.toLowerCase(),
  );
}

function ratio(matched: number, total: number): number {
  return total === 0 ? 1 : matched / total;
}

export function workArrangementFit(
  preferred: WorkArrangement | null,
  job: WorkArrangement,
): number {
  if (!preferred) return NEUTRAL;
  if (preferred === job) return 1;
  // hybrid อยู่กลางระหว่าง onsite กับ remote จึงเข้ากันได้ครึ่งหนึ่ง
  if (preferred === 'HYBRID' || job === 'HYBRID') return 0.5;
  return 0;
}

export function salaryFit(
  preferredMin: number | null,
  job: { salaryMin: number | null; salaryMax: number | null },
): number {
  const top = job.salaryMax ?? job.salaryMin;
  if (preferredMin === null || top === null) return NEUTRAL;
  return top >= preferredMin ? 1 : 0;
}

/** สัดส่วนคำของตำแหน่งที่อยากได้ (ตัวที่ใกล้ที่สุด) ที่ปรากฏในชื่องาน */
export function roleFit(desiredRoles: string[], title: string): number {
  const roles = desiredRoles.map(tokens).filter((words) => words.length > 0);
  if (roles.length === 0) return NEUTRAL;
  const titleWords = new Set(tokens(title));
  return Math.max(
    ...roles.map(
      (words) =>
        words.filter((word) => titleWords.has(word)).length / words.length,
    ),
  );
}

export function calculateMatch(
  candidate: MatchCandidate,
  job: MatchJob,
): MatchResult {
  const listed = new Set(candidate.skillIds);
  const hasListedSkills = listed.size > 0;

  const matchedSkills: SkillRef[] = [];
  const unconfirmedSkills: UnconfirmedSkill[] = [];
  const missingSkills: SkillRef[] = [];

  for (const skill of job.skills) {
    const ref = { id: skill.id, name: skill.name, required: skill.required };
    if (listed.has(skill.id)) {
      matchedSkills.push(ref);
    } else if (mentions(candidate.profileText, skill.name)) {
      unconfirmedSkills.push({ ...ref, reason: 'MENTIONED_IN_PROFILE' });
    } else if (!hasListedSkills) {
      unconfirmedSkills.push({ ...ref, reason: 'NO_SKILLS_LISTED' });
    } else {
      missingSkills.push(ref);
    }
  }

  // นับเฉพาะที่ยืนยันแล้ว: ทักษะที่แค่ถูกพูดถึงไม่ได้คะแนน
  // (ผู้สมัครติ๊กเพิ่มในโปรไฟล์แล้วคะแนนจะขึ้นเอง)
  const countMatched = (required: boolean) =>
    matchedSkills.filter((skill) => skill.required === required).length;
  const countTotal = (required: boolean) =>
    job.skills.filter((skill) => skill.required === required).length;

  const requiredRatio = ratio(countMatched(true), countTotal(true));
  const niceRatio = ratio(countMatched(false), countTotal(false));

  const preferenceFit = {
    workArrangement: workArrangementFit(
      candidate.preferredWorkArrangement,
      job.workArrangement,
    ),
    salary: salaryFit(candidate.preferredSalaryMin, job),
    role: roleFit(candidate.desiredRoles, job.title),
  };
  const preferenceAverage =
    (preferenceFit.workArrangement +
      preferenceFit.salary +
      preferenceFit.role) /
    3;

  const breakdown = {
    required: WEIGHTS.required * requiredRatio,
    niceToHave: WEIGHTS.niceToHave * niceRatio,
    preferences: WEIGHTS.preferences * preferenceAverage,
  };

  const score = Math.round(
    breakdown.required + breakdown.niceToHave + breakdown.preferences,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown: {
      required: Math.round(breakdown.required * 10) / 10,
      niceToHave: Math.round(breakdown.niceToHave * 10) / 10,
      preferences: Math.round(breakdown.preferences * 10) / 10,
    },
    matchedSkills,
    unconfirmedSkills,
    missingSkills,
    preferenceFit,
  };
}
