import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const { access_token, refresh_token } = await req.json().catch(() => ({} as any));
  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 });
  }

  // Optionally, add a simple CSRF check in dev:
  // const origin = req.headers.get("origin"); if (origin && !origin.includes("localhost:3000")) { ... }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
