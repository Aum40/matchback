"use server";

import { apiFetch } from "@/lib/api/api-fetch";
import { auth } from "@/lib/auth";

export async function getAnalyticsDashboardAction() {
  try {
    const session = await auth();
    const token = session?.user.access_token;
    if (!token) return { error: "Unauthorized" };

    const data = await apiFetch("/analytics/dashboard", { token });
    return { data };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to load analytics" };
  }
}
