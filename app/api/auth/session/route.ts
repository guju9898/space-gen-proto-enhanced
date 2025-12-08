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

  let code: string | null = null;
  try {
    const body = await req.json().catch(() => ({}));
    // accept ?code=… or body.code
    const url = new URL(req.url);
    code = (body?.code as string) ?? url.searchParams.get("code");
  } catch {
    /* ignore */
  }

  if (!code) {
    return NextResponse.json({ error: "missing code" }, { status: 400 });
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // cookies are set by the server client’s cookie adapter
  return NextResponse.json({ ok: true, user: data.user ?? null });
}