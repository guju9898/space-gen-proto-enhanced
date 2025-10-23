import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/createRouteClient";

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true; // dev leniency
  try {
    const u = new URL(origin);
    return u.hostname === "localhost" && (u.port === "3000" || u.port === "3001" || !u.port);
  } catch {
    return false;
  }
}

export async function GET() {
  const supabase = await createRouteSupabase();

  // If you previously used getSession, keep it:
  const { data: sessionData } = await supabase.auth.getSession();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: userData.user,
    // expose what you previously returned; keep shape stable
    session: sessionData.session ?? null,
  });
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const { access_token, refresh_token } = await req.json().catch(() => ({} as any));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  const supabase = await createRouteSupabase();

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const supabase = await createRouteSupabase();

  await supabase.auth.signOut(); // clears sb-* cookies
  return NextResponse.json({ ok: true });
}