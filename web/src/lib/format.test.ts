import { formatSalary, scoreLabel } from "@/lib/format";
import { describe, expect, it } from "vitest";

describe("formatSalary", () => {
  it("shows a monthly baht range", () => {
    expect(formatSalary(28000, 40000)).toBe("฿28,000 – 40,000 /mo");
  });

  it("shows a single value when only one side is known", () => {
    expect(formatSalary(null, 45000)).toBe("฿45,000 /mo");
    expect(formatSalary(30000, null)).toBe("฿30,000 /mo");
  });

  it("says so when the salary is not listed", () => {
    expect(formatSalary(null, null)).toBe("Salary not listed");
  });
});

describe("scoreLabel", () => {
  it("describes fit, never chances", () => {
    expect(scoreLabel(90)).toBe("Strong fit");
    expect(scoreLabel(60)).toBe("Partial fit");
    expect(scoreLabel(20)).toBe("Stretch");
  });
});
