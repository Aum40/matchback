import { apiFetch } from "@/lib/api/api-fetch";
import type { Application, ApplicationStatus } from "@/lib/api/api.type";
import type { ApplicationUpdateInput } from "@/lib/schemas/application.schema";

export const ApplicationsApi = {
  findAll(token: string, status?: ApplicationStatus) {
    const qs = status ? `?status=${status}` : "";
    return apiFetch<Application[]>(`/applications${qs}`, { token, cache: "no-store" });
  },

  update(id: string, data: ApplicationUpdateInput, token: string) {
    return apiFetch<Application>(`/applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: data,
      token,
    });
  },

  remove(id: string, token: string) {
    return apiFetch<{ id: string }>(`/applications/${encodeURIComponent(id)}`, {
      method: "DELETE",
      token,
    });
  },
};
