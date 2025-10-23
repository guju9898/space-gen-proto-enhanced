import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createSupabaseForRoute() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: (name, value, options) => cookieStore.set({ name, value, ...options }),
        remove: (name, _opts) => cookieStore.set({ name, value: "", ..._opts }),
      },
    }
  );
}
