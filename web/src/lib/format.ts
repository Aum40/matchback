import type {
  ApplicationStatus,
  EmploymentType,
  WorkArrangement,
} from "@/lib/api/api.type";

export const WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
};

/** ลำดับนี้คือลำดับที่แสดงใน dropdown สถานะ */
export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  INTERESTED: "Interested",
  APPLIED: "Applied",
  INTERVIEWING: "Interviewing",
  REJECTED: "Rejected",
  OFFER: "Offer",
};

const baht = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

/** เงินเดือนต่อเดือน: "฿28,000 – 40,000 /mo", ไม่ระบุ = "Salary not listed" */
export function formatSalary(min: number | null, max: number | null): string {
  if (min === null && max === null) return "Salary not listed";
  if (min !== null && max !== null && min !== max) {
    return `฿${baht.format(min)} – ${baht.format(max)} /mo`;
  }
  return `฿${baht.format((min ?? max)!)} /mo`;
}

/** คำอธิบายระดับคะแนน — ระวังถ้อยคำ: ห้ามสื่อว่าเป็นโอกาสได้งาน */
export function scoreLabel(score: number): string {
  if (score >= 75) return "Strong fit";
  if (score >= 50) return "Partial fit";
  return "Stretch";
}
