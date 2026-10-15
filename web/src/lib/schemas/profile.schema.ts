import z from "zod";

const WORK_ARRANGEMENTS = ["ONSITE", "HYBRID", "REMOTE"] as const;

/** ต้องตรงกับ UpdateProfileDto ฝั่ง API (api/src/candidates/dto/update-profile.dto.ts) */
export const profileInputSchema = z.object({
  headline: z.string().trim().max(150),
  education: z.string().trim().max(2000),
  experience: z.string().trim().max(4000),
  projects: z.string().trim().max(4000),
  desiredRoles: z.array(z.string().trim().min(1).max(100)).max(5),
  preferredSalaryMin: z.number().int().min(0).nullable(),
  preferredWorkArrangement: z.enum(WORK_ARRANGEMENTS).nullable(),
  skillIds: z.array(z.string()).max(50),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

function splitRoles(value: string): string[] {
  return value
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);
}

/**
 * รูปของฟอร์ม: ช่องตัวเลข/ตัวเลือก/รายการเป็นสตริงตามที่ input ส่งมา
 * แปลงเป็น ProfileInput ด้วย toProfileInput() ก่อนส่ง
 */
export const profileFormSchema = profileInputSchema.extend({
  desiredRoles: z
    .string()
    .refine(
      (value) => splitRoles(value).length <= 5,
      "Up to 5 roles, separated by commas",
    ),
  preferredSalaryMin: z.string().trim().regex(/^\d*$/, "Numbers only, e.g. 30000"),
  preferredWorkArrangement: z.enum(["", ...WORK_ARRANGEMENTS]),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function toProfileInput(form: ProfileFormValues): ProfileInput {
  return {
    ...form,
    desiredRoles: splitRoles(form.desiredRoles),
    preferredSalaryMin: form.preferredSalaryMin
      ? Number(form.preferredSalaryMin)
      : null,
    preferredWorkArrangement: form.preferredWorkArrangement || null,
  };
}
