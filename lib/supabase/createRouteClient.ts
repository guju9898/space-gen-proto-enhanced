// lib/supabase/createRouteClient.ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createRouteSupabase() {
  const cookieStore = await cookies(); // Next 15 requires awaited cookies in route handlers
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}
