import { apiFetch } from "@/lib/api/api-fetch";
import type {
  DiscoverJob,
  Job,
  JobMatchResponse,
  MatchExplanation,
  ResumeCoaching,
  Skill,
  SwipeDirection,
} from "@/lib/api/api.type";

export const JobsApi = {
  /** ไม่ต้องล็อกอิน (หน้าแรกใช้) */
  findAll() {
    return apiFetch<Job[]>("/jobs", { cache: "no-store" });
  },

  findOne(id: string) {
    return apiFetch<Job>(`/jobs/${encodeURIComponent(id)}`);
  },

  /** งานที่ยังไม่เคยปัด เรียงคะแนนมากไปน้อย */
  discover(token: string) {
    return apiFetch<DiscoverJob[]>("/jobs/discover", { token, cache: "no-store" });
  },

  swipe(id: string, direction: SwipeDirection, token: string) {
    return apiFetch<{ jobId: string; direction: SwipeDirection }>(
      `/jobs/${encodeURIComponent(id)}/swipe`,
      { method: "POST", body: { direction }, token },
    );
  },

  resetSwipes(token: string) {
    return apiFetch<{ cleared: number }>("/jobs/swipes", {
      method: "DELETE",
      token,
    });
  },

  getMatch(id: string, token: string) {
    return apiFetch<JobMatchResponse>(`/jobs/${encodeURIComponent(id)}/match`, {
      token,
      cache: "no-store",
    });
  },

  explainMatch(id: string, token: string) {
    return apiFetch<MatchExplanation>(
      `/jobs/${encodeURIComponent(id)}/match/explanation`,
      { method: "POST", token },
    );
  },

  coachResume(jobId: string, token: string) {
    return apiFetch<ResumeCoaching>("/resume/coach", {
      method: "POST",
      body: { jobId },
      token,
    });
  },

  skills() {
    return apiFetch<Skill[]>("/skills");
  },
};
