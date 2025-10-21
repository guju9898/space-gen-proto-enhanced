import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

/**
 * Server-only endpoint to validate the logged-in user and confirm an active subscription.
 * - Requires SUPABASE_SERVICE_ROLE_KEY in server env.
 * - Returns 200 { ok: true } if active; 401/403 otherwise.
 */

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.getAll().find(c => /sb-.*-auth-token/.test(c.name));
  const token = authCookie?.value;
  if (!token) return NextResponse.json({ ok: false }, { status: 401 });

  // Validate user using service role key (server-side only)
  const { data: userResult } = await supabaseAdmin.auth.getUser(token);
  const user = userResult?.user;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Query subscriptions table (adjust table/column names if your schema differs)
  const { data: subscription, error } = await supabaseAdmin
    .from("subscriptions")
    .select("status")
    .eq("user_id", user.id)
    .single();

  if (error || !subscription || subscription.status !== "active") {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}
