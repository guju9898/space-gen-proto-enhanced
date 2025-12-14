import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/createRouteClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** allow localhost + NEXT_PUBLIC_DOMAIN for dev */
function isAllowedOrigin(origin: string | null) {
  if (!origin) return true;
  try {
    const u = new URL(origin);
    const allowed = new Set([
      "http://localhost:3000",
      process.env.NEXT_PUBLIC_DOMAIN,
    ]);
    return allowed.has(u.origin);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: "origin not allowed" }, { status: 400 });
  }

  const supabase = await createRouteSupabase();

  try {
    const body = await req.json().catch(() => ({}));
    
    // This endpoint only handles token-based flows (magic links)
    // OAuth/PKCE code exchange MUST happen client-side where PKCE verifier cookie is available
    const access_token = body?.access_token as string | undefined;
    const refresh_token = body?.refresh_token as string | undefined;

    if (access_token && refresh_token) {
      // Magic link flow: set session directly with tokens
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      // cookies are set by the server client's cookie adapter
      return NextResponse.json({ ok: true, user: data.user ?? null });
    } else {
      return NextResponse.json(
        { error: "missing access_token/refresh_token. Code exchange must happen client-side." },
        { status: 400 }
      );
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "invalid request" },
      { status: 400 }
    );
  }
}