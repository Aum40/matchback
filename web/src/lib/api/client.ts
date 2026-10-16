const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    statusCode: number;
    message: string;
    code?: string;
  };
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // ส่ง Session / Cookie ไปยัง NestJS Backend
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: {
          statusCode: res.status,
          message: Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "An unexpected error occurred",
          code: result.code || result.error,
        },
      };
    }

    return { data: result as T };
  } catch (err) {
    return {
      error: {
        statusCode: 500,
        message: err instanceof Error ? err.message : "Network error",
      },
    };
  }
}
