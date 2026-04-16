/**
 * Gói miễn phí của ngrok trả về trang cảnh báo HTML cho nhiều request nếu không gửi header này,
 * khiến `fetch` tới `/api/*` không parse được JSON và đăng nhập thất bại.
 * @see https://ngrok.com/docs/traffic-policy/actions/headers/#skip-browser-warning
 */
export function tunnelBypassHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const host = window.location.hostname;
  if (host.includes("ngrok")) {
    return { "ngrok-skip-browser-warning": "true" };
  }
  return {};
}

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export type ApiJsonInit = Omit<RequestInit, "body"> & {
  json?: unknown;
};

export async function apiJson<T>(path: string, init?: ApiJsonInit): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const hasJsonBody = json !== undefined;
  const res = await fetch(path, {
    ...rest,
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...tunnelBypassHeaders(),
      ...headers,
    },
    ...(hasJsonBody ? { body: JSON.stringify(json) } : {}),
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    parsed = {};
  }

  const data = parsed as T & { message?: string };

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
        ? data.message
        : res.statusText || "Yêu cầu thất bại.";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}
