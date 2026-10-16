"use server";

import { apiFetch } from "@/lib/api/api-fetch";
import { auth } from "@/lib/auth";

export async function getAnalyticsDashboardAction() {
  try {
    const session = await auth();
    const token = (session?.user as any)?.access_token;
    if (!token) return { error: "Unauthorized" };

    const data = await apiFetch("/analytics/dashboard", { token });
    return { data };
  } catch (err: any) {
    return { error: err.message || "Failed to load analytics" };
  }
}