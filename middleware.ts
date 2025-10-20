import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/studio"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hasAccess = req.cookies.get("sb-access-token")?.value;

  if (!hasAccess) {
    url.pathname = "/auth/login";
    url.search = `?redirect=${encodeURIComponent(req.nextUrl.pathname)}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}