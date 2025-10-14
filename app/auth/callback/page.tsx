// app/auth/callback/page.tsx
"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    async function handle() {
      try {
        // Exchange the magic link token for a session and store session cookies
        const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });

        const redirectTo = params?.get("redirectTo") ?? "/";

        if (error) {
          console.error("Auth callback error:", error);
          // Redirect back to login and surface the error so UI can show a message
          router.replace(`/auth/login?error=${encodeURIComponent(error.message)}&redirect=${encodeURIComponent(redirectTo)}`);
          return;
        }

        // Success — go to the original destination
        router.replace(redirectTo);
      } catch (err) {
        console.error("Auth callback unexpected error:", err);
        router.replace(`/auth/login?error=unexpected_error`);
      }
    }

    handle();
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="mb-4">Signing you in — please wait...</p>
        <div className="loader" />
      </div>
    </div>
  );
}
