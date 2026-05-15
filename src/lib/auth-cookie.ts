/** Cookie httpOnly đồng bộ với middleware (không dùng localStorage trên server). */
export const WP_AUTH_COOKIE_NAME = "wp_graphql_auth";
export const WP_REFRESH_COOKIE_NAME = "wp_graphql_refresh";

/** JWT auth token — ngắn hạn (plugin WP JWT thường ~5 phút–1 giờ). */
export const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60;

/** Refresh token — dài hạn, dùng rotate qua /api/auth/refresh. */
export const REFRESH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function isHttpsRequest(request?: Pick<Request, "headers">): boolean {
  if (!request) return false;
  const proto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  return proto === "https";
}

/** Gọi từ route handler; truyền `request` để cookie Secure đúng khi chạy `next dev` sau tunnel HTTPS (ngrok, v.v.). */
export function wpAuthCookieOptions(maxAgeSec: number, request?: Pick<Request, "headers">) {
  const secure =
    process.env.NODE_ENV === "production" ||
    isHttpsRequest(request) ||
    process.env.FORCE_SECURE_AUTH_COOKIE === "1";

  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export type AuthSessionTokens = {
  authToken: string;
  refreshToken?: string | null;
};

export function applyAuthSessionCookies(
  response: { cookies: { set: (name: string, value: string, options: ReturnType<typeof wpAuthCookieOptions>) => void } },
  tokens: AuthSessionTokens,
  request?: Pick<Request, "headers">,
): void {
  response.cookies.set(
    WP_AUTH_COOKIE_NAME,
    tokens.authToken,
    wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, request),
  );

  const refresh = tokens.refreshToken?.trim() ?? "";
  if (refresh !== "") {
    response.cookies.set(
      WP_REFRESH_COOKIE_NAME,
      refresh,
      wpAuthCookieOptions(REFRESH_COOKIE_MAX_AGE_SEC, request),
    );
  }
}

export function clearAuthSessionCookies(
  response: { cookies: { set: (name: string, value: string, options: ReturnType<typeof wpAuthCookieOptions>) => void } },
  request?: Pick<Request, "headers">,
): void {
  response.cookies.set(WP_AUTH_COOKIE_NAME, "", wpAuthCookieOptions(0, request));
  response.cookies.set(WP_REFRESH_COOKIE_NAME, "", wpAuthCookieOptions(0, request));
}
