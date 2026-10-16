import type { CandidateCard, SwipeResult } from "./api.type";
import { apiFetch } from "./client";

// --- Types ---
export interface CompanyInput {
  name: string;
  description?: string;
  website?: string;
  logoUrl?: string;
  location?: string;
  industry?: string;
  size?: string;
}

export interface CompanyResponse extends CompanyInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobInput {
  title: string;
  description: string;
  location?: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
}

export interface JobResponse extends JobInput {
  id: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
}

// --- API Functions ---

/** ดึงข้อมูลบริษัทของผู้ใช้งานปัจจุบัน */
export async function getCompany() {
  return apiFetch<CompanyResponse>("/companies/me");
}

/** สร้าง หรือ อัปเดตข้อมูลบริษัท */
export async function updateCompany(data: CompanyInput) {
  return apiFetch<CompanyResponse>("/companies/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/** ดึงรายการงานทั้งหมดที่ Recruiter คนนี้สร้างไว้ */
export async function getRecruiterJobs() {
  return apiFetch<JobResponse[]>("/recruiter/jobs");
}

/** ดึงรายละเอียดงานตาม ID */
export async function getRecruiterJob(id: string) {
  return apiFetch<JobResponse>(`/recruiter/jobs/${id}`);
}

/** สร้างงานใหม่ (สถานะเริ่มต้นจะเป็น DRAFT) */
export async function createRecruiterJob(data: JobInput) {
  return apiFetch<JobResponse>("/recruiter/jobs", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** อัปเดตข้อมูลงาน หรือ เปลี่ยนสถานะ (เช่น DRAFT -> PUBLISHED) */
export async function updateRecruiterJob(id: string, data: Partial<JobInput>) {
  return apiFetch<JobResponse>(`/recruiter/jobs/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** ดึงรายการ Candidate Deck สำหรับงานนั้นๆ */
export async function getCandidateDeck(jobId: string) {
  return apiFetch<CandidateCard[]>(`/recruiter/jobs/${jobId}/candidates`);
}

/** ปัดคัดเลือกผู้สมัคร (LIKE / SKIP) */
export async function swipeCandidate(
  jobId: string,
  candidateId: string,
  direction: "LIKE" | "SKIP"
) {
  return apiFetch<SwipeResult>(
    `/recruiter/jobs/${jobId}/candidates/${candidateId}/swipe`,
    {
      method: "POST",
      body: JSON.stringify({ direction }),
    }
  );
}
