import z from "zod";

/** ต้องตรงกับ UpdateApplicationDto ฝั่ง API */
export const applicationUpdateSchema = z.object({
  status: z
    .enum(["INTERESTED", "APPLIED", "INTERVIEWING", "REJECTED", "OFFER"])
    .optional(),
  notes: z.string().trim().max(2000).optional(),
  employerFeedback: z.string().trim().max(2000).optional(),
});

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;
