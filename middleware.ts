import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = { matcher: ["/studio/:path*"] };

export function middleware(req: NextRequest) {
  // Detect the auth-helpers cookies, e.g. sb-<projectRef>-auth-token
  const hasAuthCookie = req.cookies
    .getAll()
    .some((c) => /sb-.*-auth-token/.test(c.name));

  if (!hasAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}