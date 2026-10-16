import { apiFetch } from "@/lib/api/api-fetch";
import type { MutualMatch } from "@/lib/api/api.type";

export const MatchesApi = {
  findAll(token: string) {
    return apiFetch<MutualMatch[]>("/matches", { token, cache: "no-store" });
  },

  findOne(id: string, token: string) {
    return apiFetch<MutualMatch>(`/matches/${encodeURIComponent(id)}`, {
      token,
      cache: "no-store",
    });
  },
};
