import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, WP_REFRESH_COOKIE_NAME } from "@/lib/auth-cookie";

/** Chi cho crawler doc trang chu (meta verification) — khong mo toan bo app. */
const CRAWLER_UA_REGEX =
  /(zalobot|zalo|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|pinterestbot|applebot)/i;

const CRAWLER_PUBLIC_PATHS = new Set(["/"]);

function isCrawlerRequest(request: NextRequest): boolean {
  const ua = request.headers.get("user-agent") ?? "";
  return CRAWLER_UA_REGEX.test(ua);
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get(WP_AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  if (isCrawlerRequest(request) && CRAWLER_PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(WP_REFRESH_COOKIE_NAME)?.value;
  if (refreshToken) {
    const refreshUrl = request.nextUrl.clone();
    refreshUrl.pathname = "/api/auth/refresh";
    refreshUrl.search = "";
    refreshUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(refreshUrl);
  }

  const url = request.nextUrl.clone();
  url.pathname = "/logout";
  if (pathname && pathname !== "/logout") {
    url.searchParams.set("next", pathname + request.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logout|forgot-password|forgot-password-domain|service-policy|.*\\..*).*)",
  ],
};
