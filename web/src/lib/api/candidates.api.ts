import { apiFetch } from "@/lib/api/api-fetch";
import type { CandidateProfile } from "@/lib/api/api.type";
import type { ProfileInput } from "@/lib/schemas/profile.schema";

export const CandidatesApi = {
  getProfile(token: string) {
    return apiFetch<CandidateProfile>("/candidates/me", { token, cache: "no-store" });
  },

  updateProfile(data: ProfileInput, token: string) {
    return apiFetch<CandidateProfile>("/candidates/me", {
      method: "PUT",
      body: data,
      token,
    });
  },
};
