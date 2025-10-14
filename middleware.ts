// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight middleware protecting /studio.
 * If no Supabase session cookie (sb-access-token) exists, redirect to /auth/login.
 * This is intentionally minimal — real subscription checks happen server-side in the studio page.
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Protect /studio and nested routes
  if (url.pathname.startsWith("/studio")) {
    // Supabase stores the access token in sb-access-token cookie (default)
    const token = req.cookies.get("sb-access-token")?.value;
    if (!token) {
      url.pathname = "/auth/login";
      url.searchParams.set("redirect", req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/studio/:path*"],
};
