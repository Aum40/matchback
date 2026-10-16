import z from "zod";

/** บรรทัด `KEY=` ใน .env มาเป็นสตริงว่าง ถือว่าไม่ได้ตั้ง */
const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

const envSchema = z.object({
  API_URL: z.url(),
  AUTH_SECRET: z.string().min(1),
  /** ไม่ตั้งทั้งคู่ = ปิดล็อกอินด้วย Google (ซ่อนปุ่ม) */
  GOOGLE_CLIENT_ID: optionalString,
  GOOGLE_CLIENT_SECRET: optionalString,
  DEMO_CANDIDATE_EMAIL: optionalString,
  DEMO_CANDIDATE_PASSWORD: optionalString,
  DEMO_RECRUITER_EMAIL: optionalString,
  DEMO_RECRUITER_PASSWORD: optionalString,
  /**
   * รหัสลับร่วมกับ API (ค่าเดียวกับ INTERNAL_API_SECRET ของ API) API จะเชื่อ IP ผู้ใช้ที่ส่งไป
   * ไม่ตั้ง (dev) = ส่ง IP ผ่าน X-Forwarded-For แทน (API เชื่อเพราะอยู่เครื่องเดียวกัน)
   */
  INTERNAL_API_SECRET: optionalString,
});

const parsed = envSchema.safeParse({
  API_URL: process.env.API_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  DEMO_CANDIDATE_EMAIL: process.env.DEMO_CANDIDATE_EMAIL,
  DEMO_CANDIDATE_PASSWORD: process.env.DEMO_CANDIDATE_PASSWORD,
  DEMO_RECRUITER_EMAIL: process.env.DEMO_RECRUITER_EMAIL,
  DEMO_RECRUITER_PASSWORD: process.env.DEMO_RECRUITER_PASSWORD,
  INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
});

if (!parsed.success) {
  throw new Error(`Env validation failed\n${z.prettifyError(parsed.error)}\n`);
}

export const env = parsed.data;

/** ต้องมีครบทั้ง id และ secret ถึงจะเปิดปุ่ม Google ได้ */
export const googleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET,
);

export const demoLoginEnabled = {
  candidate: Boolean(env.DEMO_CANDIDATE_EMAIL && env.DEMO_CANDIDATE_PASSWORD),
  recruiter: Boolean(env.DEMO_RECRUITER_EMAIL && env.DEMO_RECRUITER_PASSWORD),
};
