// Back-compat shim so old imports keep working.
// Re-exports the unified server helper and the legacy-named factory.
export { getSupabaseServerClient } from "@/lib/supabase-server";
export { createRouteSupabase } from "@/lib/supabase/createRouteClient";
export type {} from "@supabase/supabase-js"; // no-op, keeps TS happy if types were imported



