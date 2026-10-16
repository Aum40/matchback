import { apiFetch } from "@/lib/api/api-fetch";
import type { AssistantMessage, AssistantResponse } from "@/lib/api/api.type";

export const AssistantApi = {
  send(messages: AssistantMessage[], jobId: string | undefined, token: string) {
    return apiFetch<AssistantResponse>("/assistant/messages", {
      method: "POST",
      body: { messages, ...(jobId && { jobId }) },
      token,
    });
  },
};
