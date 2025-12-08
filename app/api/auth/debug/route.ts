import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  return NextResponse.json({ user: user ? { id: user.id, email: user.email } : null, error });
}




