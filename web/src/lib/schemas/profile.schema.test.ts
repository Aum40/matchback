import {
  profileFormSchema,
  profileInputSchema,
  toProfileInput,
} from "@/lib/schemas/profile.schema";
import { describe, expect, it } from "vitest";

const form = {
  headline: "",
  education: "",
  experience: "",
  projects: "",
  desiredRoles: " Frontend Developer ,  , Data Analyst",
  preferredSalaryMin: "30000",
  preferredWorkArrangement: "HYBRID" as const,
  skillIds: ["react"],
};

describe("profile form", () => {
  it("converts form strings into the API input shape", () => {
    const input = toProfileInput(profileFormSchema.parse(form));

    expect(input.desiredRoles).toEqual(["Frontend Developer", "Data Analyst"]);
    expect(input.preferredSalaryMin).toBe(30000);
    expect(input.preferredWorkArrangement).toBe("HYBRID");
    expect(profileInputSchema.safeParse(input).success).toBe(true);
  });

  it("turns blank optional fields into null", () => {
    const input = toProfileInput(
      profileFormSchema.parse({
        ...form,
        preferredSalaryMin: "",
        preferredWorkArrangement: "",
      }),
    );
    expect(input.preferredSalaryMin).toBeNull();
    expect(input.preferredWorkArrangement).toBeNull();
  });

  it("rejects a non-numeric salary and more than 5 roles", () => {
    expect(
      profileFormSchema.safeParse({ ...form, preferredSalaryMin: "30k" }).success,
    ).toBe(false);
    expect(
      profileFormSchema.safeParse({ ...form, desiredRoles: "a,b,c,d,e,f" })
        .success,
    ).toBe(false);
  });
});
