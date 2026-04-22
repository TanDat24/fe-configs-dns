import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

// Cho phep cac bot crawler (Zalo / Google / FB / ...) xem HTML cua trang chu
// ma khong bi redirect sang /logout -- can thiet de verify meta tag.
const CRAWLER_UA_REGEX =
  /(zalobot|zalo|googlebot|bingbot|yandex|baiduspider|duckduckbot|slurp|facebookexternalhit|facebot|meta-externalagent|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|discordbot|pinterestbot|applebot)/i;

export function middleware(request: NextRequest) {
  const token = request.cookies.get(WP_AUTH_COOKIE_NAME)?.value;
  if (token) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (CRAWLER_UA_REGEX.test(userAgent)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/logout";
  const pathname = request.nextUrl.pathname;
  if (pathname && pathname !== "/logout") {
    url.searchParams.set("next", pathname + request.nextUrl.search);
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logout|forgot-password|.*\\..*).*)",
  ],
};
