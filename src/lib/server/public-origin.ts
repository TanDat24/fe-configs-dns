import "server-only";

/**
 * Lay public origin that cua request, ke ca khi server chay sau reverse proxy.
 *
 * Uu tien:
 *   1. `x-forwarded-proto` + `x-forwarded-host` (chuan cho nginx / Cloudflare / Vercel / PaaS)
 *   2. Header `host` + scheme suy ra tu `x-forwarded-proto` hoac `forwarded`
 *   3. Fallback ve `new URL(request.url).origin` (dev / localhost)
 *
 * Co the override toan bo bang env `NEXT_PUBLIC_SITE_URL` (tien cho deploy co domain co dinh).
 */
function normalizeHost(hostValue: string, protoValue: string): string {
  const host = hostValue.trim();
  const proto = protoValue.trim().toLowerCase();
  if (proto === "https" && host.endsWith(":443")) return host.slice(0, -4);
  if (proto === "http" && host.endsWith(":80")) return host.slice(0, -3);
  return host;
}

function originFromForwardedHeaders(request: Request): string | null {
  const headers = request.headers;
  const xfHost = headers.get("x-forwarded-host") ?? headers.get("x-original-host");
  if (!xfHost) return null;

  const xfProto = headers.get("x-forwarded-proto");
  const proto = (xfProto ?? "https").split(",")[0].trim();
  const host = normalizeHost(xfHost.split(",")[0], proto);
  if (!host) return null;

  return `${proto}://${host}`;
}

export function getPublicOrigin(request: Request): string {
  const override = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  // Dev: OAuth redirect_uri phai khop origin dang mo (localhost), ke ca khi env ghi production.
  if (process.env.NODE_ENV !== "production") {
    const host = (request.headers.get("host") ?? "").toLowerCase();
    if (host.includes("localhost") || host.startsWith("127.0.0.1")) {
      return new URL(request.url).origin;
    }
  }

  // Production behind reverse proxy: uu tien Host that user thay (tranh NEXT_PUBLIC_SITE_URL build sai).
  if (process.env.NODE_ENV === "production") {
    const forwarded = originFromForwardedHeaders(request);
    if (forwarded) {
      return forwarded;
    }
  }

  if (override) {
    return override.replace(/\/$/, "");
  }

  const forwarded = originFromForwardedHeaders(request);
  if (forwarded) {
    return forwarded;
  }

  const host = request.headers.get("host");
  if (host) {
    const xfProto = request.headers.get("x-forwarded-proto");
    const proto = (xfProto ?? (host.startsWith("localhost") ? "http" : "https"))
      .split(",")[0]
      .trim();
    return `${proto}://${normalizeHost(host, proto)}`;
  }

  return new URL(request.url).origin;
}

/** Zalo/Google OAuth redirect_uri — must match developer console exactly. */
export function getOAuthRedirectUri(request: Request, callbackPath: string): string {
  const path = callbackPath.startsWith("/") ? callbackPath : `/${callbackPath}`;
  return `${getPublicOrigin(request)}${path}`;
}