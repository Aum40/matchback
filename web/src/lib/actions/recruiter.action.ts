"use server";

import { apiFetch } from "@/lib/api/api-fetch";
import { auth } from "@/lib/auth";

export interface CompanyInput {
  name: string;
  description?: string;
  website?: string;
  location?: string;
  industry?: string;
  size?: string;
}

export interface JobInput {
  title: string;
  description: string;
  location?: string;
  employmentType?: string;
  workArrangement?: "ONSITE" | "HYBRID" | "REMOTE";
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  status?: "DRAFT" | "PUBLISHED" | "CLOSED";
}

/** ฟังก์ชันช่วยดึง accessToken จาก NextAuth Session */
async function getAuthToken() {
  const session = await auth();
  const s = session as any;
  const token =
    s?.user?.access_token ||
    s?.user?.accessToken ||
    s?.accessToken ||
    s?.token;

  return token as string | undefined;
}

/** แปลง skills จาก string[] เป็น [{ id: skill, required: true }] ตาม DTO ของ Backend */
function formatSkills(skills?: string[]) {
  if (!skills || !Array.isArray(skills)) return undefined;
  return skills.map((skill) => {
    if (typeof skill === "string") {
      // แปลงข้อความให้เป็นตัวพิมพ์เล็กและตัดช่องว่าง เพื่อให้ตรงกับ ID ใน DB Master Data
      const formattedId = skill
        .toLowerCase()
        .trim()
        .replace("node.js", "nodejs"); // รองรับเคสพิเศษเช่น node.js -> nodejs หากหลังบ้านใช้ nodejs

      return {
        id: formattedId,
        required: true,
      };
    }
    return skill;
  });
}

/** ดึงข้อมูลบริษัทของผู้ใช้งานปัจจุบัน */
export async function getCompanyAction() {
  try {
    const token = await getAuthToken();
    const data = await apiFetch<any>("/companies/me", { token });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to fetch company profile" };
  }
}

/** สร้าง หรือ อัปเดตข้อมูลบริษัท */
export async function updateCompanyAction(input: CompanyInput) {
  try {
    const token = await getAuthToken();
    const data = await apiFetch<any>("/companies/me", {
      method: "PUT",
      body: input as unknown as Record<string, unknown>,
      token,
    });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to save company profile" };
  }
}

/** ดึงรายการงานทั้งหมดที่ Recruiter คนนี้สร้างไว้ */
export async function getRecruiterJobsAction() {
  try {
    const token = await getAuthToken();
    const data = await apiFetch<any[]>("/recruiter/jobs", { token });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to fetch jobs" };
  }
}

/** สร้างงานใหม่ (สถานะเริ่มต้นจะเป็น DRAFT) */
export async function createRecruiterJobAction(input: JobInput) {
  try {
    const token = await getAuthToken();
    const payload = {
      ...input,
      skills: formatSkills(input.skills),
    };

    const data = await apiFetch<any>("/recruiter/jobs", {
      method: "POST",
      body: payload as unknown as Record<string, unknown>,
      token,
    });
    return { data };
  } catch (err: any) {
    console.error("❌ [createRecruiterJobAction Error]:", err);
    return { error: err.message || "Failed to create job" };
  }
}

/** อัปเดตข้อมูลงาน หรือ เปลี่ยนสถานะ (เช่น DRAFT -> PUBLISHED) */
export async function updateRecruiterJobAction(
  id: string,
  input: Partial<JobInput>
) {
  try {
    const token = await getAuthToken();
    const payload = {
      ...input,
      ...(input.skills ? { skills: formatSkills(input.skills) } : {}),
    };

    const data = await apiFetch<any>(`/recruiter/jobs/${id}`, {
      method: "PATCH",
      body: payload as unknown as Record<string, unknown>,
      token,
    });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to update job" };
  }
}

/** ดึงรายการ Candidate Deck สำหรับงานนั้นๆ */
export async function getCandidateDeckAction(jobId: string) {
  try {
    const token = await getAuthToken();
    const data = await apiFetch<any[]>(`/recruiter/jobs/${jobId}/candidates`, {
      token,
    });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to fetch candidates" };
  }
}

/** ปัดคัดเลือกผู้สมัคร (LIKE / SKIP) */
export async function swipeCandidateAction(
  jobId: string,
  candidateId: string,
  direction: "LIKE" | "SKIP"
) {
  try {
    const token = await getAuthToken();
    const data = await apiFetch<any>(
      `/recruiter/jobs/${jobId}/candidates/${candidateId}/swipe`,
      {
        method: "POST",
        body: { direction },
        token,
      }
    );
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to record swipe" };
  }
}