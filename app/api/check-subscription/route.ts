import { NextResponse } from "next/server";
import { createRouteSupabase } from "@/lib/supabase/createRouteClient";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET() {
  const supabase = await createRouteSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error: subErr } = await supabaseAdmin
    .from("subscriptions")
    .select("id,status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (subErr) return NextResponse.json({ ok: false, error: subErr.message }, { status: 500 });
  return NextResponse.json({ ok: !!data });
}
