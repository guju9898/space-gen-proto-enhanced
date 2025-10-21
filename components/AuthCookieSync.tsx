"use client";
import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCookieSync() {
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          const at = session?.access_token;
          const rt = session?.refresh_token;
          if (at && rt) {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token: at, refresh_token: rt }),
            });
          }
        } else if (event === "SIGNED_OUT") {
          await fetch("/api/auth/session", { method: "DELETE" });
        }
      } catch {}
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return null;
}
