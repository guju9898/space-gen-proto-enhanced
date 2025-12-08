import { getSupabaseServerClient } from "@/lib/supabase-server";
/** Back-compat shim */
export async function createRouteSupabase() {
  return getSupabaseServerClient();
}


