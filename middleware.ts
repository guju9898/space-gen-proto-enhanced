// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = [/^\/my-renders(\/.*)?$/, /^\/studio(\/.*)?$/];

function getRefFromEnvUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "unknown";
  try {
    const host = new URL(raw).hostname; // "<ref>.supabase.co"
    const [ref] = host.split(".");
    return ref || "unknown";
  } catch {
    return "unknown";
  }
}

function getRefFromSbCookieName(name: string): string {
  // Handles: "sb-<ref>-auth-token" and "sb-<ref>-auth-token.0"
  return name.startsWith("sb-") ? name.slice(3).split("-")[0] : "";
}

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const res = NextResponse.next();

  // Next 15: cookie adapter uses req/res; no await cookies() in middleware
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

  // --- diagnostics (dev only) ---
  const cookieNames = req.cookies.getAll().map((c) => c.name);
  const cookieRefs = [...new Set(
    cookieNames
      .filter((n) => n.startsWith("sb-"))
      .map(getRefFromSbCookieName)
      .filter(Boolean)
  )];
  const envRef = getRefFromEnvUrl();

  if (process.env.NODE_ENV === "development") {
    console.log("[MW]", { path: url.pathname, cookieRefs, envRef });
    // Warn only if we have sb-* cookies and none match envRef
    if (cookieRefs.length > 0 && !cookieRefs.includes(envRef)) {
      console.warn(`[MW] SUPABASE PROJECT MISMATCH: cookie refs ${cookieRefs.join(",")} vs env ref ${envRef}`);
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If you ever need to debug further:
  // console.log("[MW] auth.getUser() ->", user?.id ?? null, "error:", error?.message ?? null);

  const needsAuth = PROTECTED.some((re) => re.test(url.pathname));

  if (needsAuth && !user) {
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirectTo", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

// Limit middleware to protected routes (avoids running on assets, etc.)
export const config = {
  matcher: [
    // run on app pages, NOT on API/Next internals
    "/((?!api/|_next/|favicon.ico|assets/).*)",
  ],
};
