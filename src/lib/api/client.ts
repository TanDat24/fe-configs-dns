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
  retry?: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(path: string, init: RequestInit, retry: number): Promise<Response> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retry) {
    try {
      const res = await fetch(path, init);
      if (res.status >= 500 && attempt < retry) {
        await sleep(250 * Math.pow(2, attempt));
        attempt += 1;
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt >= retry) {
        throw err;
      }
      await sleep(250 * Math.pow(2, attempt));
      attempt += 1;
    }
  }

  throw lastError ?? new Error("network_error");
}

export async function apiJson<T>(path: string, init?: ApiJsonInit): Promise<T> {
  const { json, headers, retry = 1, ...rest } = init ?? {};
  const hasJsonBody = json !== undefined;
  const requestInit: RequestInit = {
    ...rest,
    headers: {
      ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
      ...tunnelBypassHeaders(),
      ...headers,
    },
    ...(hasJsonBody ? { body: JSON.stringify(json) } : {}),
  };

  let res: Response;
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new ApiError("Mat ket noi Internet. Vui long kiem tra mang.", 0);
    }
    res = await fetchWithRetry(path, requestInit, retry);
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError("Khong the ket noi may chu. He thong se tu thu lai.", 0, err);
  }

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
