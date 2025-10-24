// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = [/^\/my-renders(\/.*)?$/, /^\/studio(\/.*)?$/];

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const res = NextResponse.next();

  // Next 15 cookie adapter using req/res (no await here)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          res.cookies.set({ name, value, ...options });
        },
        remove: (name: string, options: any) => {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const needsAuth = PROTECTED.some((re) => re.test(url.pathname));

  if (needsAuth && !user) {
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/my-renders", "/my-renders/:path*", "/studio", "/studio/:path*"],
};