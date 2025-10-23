import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true; // dev leniency
  try {
    const u = new URL(origin);
    return u.hostname === "localhost" && (u.port === "3000" || u.port === "3001" || !u.port);
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const { access_token, refresh_token } = await req.json().catch(() => ({} as any));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  // Next 15: cookies() is async
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  if (!isAllowedOrigin(req.headers.get("origin"))) {
    return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
  }

  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  await supabase.auth.signOut(); // clears sb-* cookies
  return NextResponse.json({ ok: true });
}