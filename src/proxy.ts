import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAMES } from "@/server/auth/cookies";

/**
 * Optimistic gate only: redirects visitors without a session cookie away from the
 * admin area. Real authentication/authorisation happens server-side in every page,
 * server action and route handler (requireAdmin()).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicAdmin = pathname === "/admin/login" || pathname.startsWith("/admin/setup");
  const hasCookie = SESSION_COOKIE_NAMES.some((n) => request.cookies.has(n));
  if (!isPublicAdmin && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
