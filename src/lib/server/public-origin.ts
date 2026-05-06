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
export function getPublicOrigin(request: Request): string {
  const requestOrigin = new URL(request.url).origin;
  const isLocalRequest =
    requestOrigin.includes("://localhost") ||
    requestOrigin.includes("://127.0.0.1") ||
    requestOrigin.includes("://0.0.0.0");

  const normalizeHost = (hostValue: string, protoValue: string) => {
    const host = hostValue.trim();
    const proto = protoValue.trim().toLowerCase();
    if (proto === "https" && host.endsWith(":443")) return host.slice(0, -4);
    if (proto === "http" && host.endsWith(":80")) return host.slice(0, -3);
    return host;
  };

  const override = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (override && !isLocalRequest) {
    return override.replace(/\/$/, "");
  }

  const headers = request.headers;
  const xfHost = headers.get("x-forwarded-host") ?? headers.get("x-original-host");
  const xfProto = headers.get("x-forwarded-proto");

  if (xfHost) {
    const proto = (xfProto ?? "https").split(",")[0].trim();
    const host = normalizeHost(xfHost.split(",")[0], proto);
    return `${proto}://${host}`;
  }

  const host = headers.get("host");
  if (host) {
    const proto = (xfProto ?? (host.startsWith("localhost") ? "http" : "https"))
      .split(",")[0]
      .trim();
    return `${proto}://${normalizeHost(host, proto)}`;
  }

  return requestOrigin;
}
