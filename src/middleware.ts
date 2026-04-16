import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(WP_AUTH_COOKIE_NAME)?.value;
  if (token) {
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
