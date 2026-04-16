/** Tên cookie httpOnly đồng bộ với middleware (không dùng localStorage trên server). */
export const WP_AUTH_COOKIE_NAME = "wp_graphql_auth";

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
