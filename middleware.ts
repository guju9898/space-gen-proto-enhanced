// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware: protect /studio routes by checking for a Supabase session cookie.
 * - Skips Next internals, static files, and API routes for performance.
 * - Checks multiple common Supabase cookie names; update AUTH_COOKIE_NAMES if your app uses a different name.
 */
const PUBLIC_FILE = /\.(.*)$/;
const AUTH_COOKIE_NAMES = ["sb-access-token", "supabase-auth-token", "sb:token", "sb-token"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip next internals and static files, and API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Only guard the /studio path (and its children)
  if (pathname.startsWith("/studio")) {
    // Look for any common supabase auth cookie
    const hasAuth = AUTH_COOKIE_NAMES.some((name) => !!req.cookies.get(name)?.value);
    if (!hasAuth) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = "/auth/login";
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};