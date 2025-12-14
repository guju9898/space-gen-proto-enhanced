"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function CallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("Signing you in...");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Verify client is properly initialized with API key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          setMessage("Error: Supabase environment variables not configured");
          return;
        }

        // Get token_hash and type from URL query parameters
        // URL format: /auth/callback?token_hash=xxx&type=email
        const token_hash = search?.get("token_hash");
        const type = search?.get("type") || "email";

        // If no token_hash, show friendly error message
        if (!token_hash) {
          setMessage("Missing login token. Please request a new magic link.");
          return;
        }

        // Verify the OTP token using Supabase's verifyOtp method
        setMessage("Verifying your login link...");
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as "email",
        });

        if (error) {
          console.error("OTP verification error:", error);
          setMessage(`Login failed: ${error.message}. Please request a new magic link.`);
          return;
        }

        if (!data.session) {
          setMessage("Login failed: No session created. Please request a new magic link.");
          return;
        }

        // Sync HTTP-only cookies for proxy via API route
        if (data.session.access_token && data.session.refresh_token) {
          setMessage("Completing sign-in...");
          const sessionResponse = await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            }),
          });

          if (!sessionResponse.ok) {
            const errorData = await sessionResponse.json().catch(() => ({}));
            console.error("Session sync error:", errorData);
            setMessage(`Failed to complete sign-in: ${errorData.error || sessionResponse.statusText}`);
            return;
          }
        }

        // Success! Redirect to /studio/interior
        if (!cancelled) {
          setMessage("Signed in successfully! Redirecting...");
          router.replace("/studio/interior");
        }
      } catch (e: any) {
        console.error("Callback error:", e);
        setMessage(`Unexpected error: ${e?.message || String(e)}. Please try again.`);
      }
    })();
    return () => { cancelled = true; };
  }, [search, router]);

  return (
    <div className="mx-auto max-w-md p-6 text-sm text-gray-800">
      <p>{message}</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<p className="p-6">Signing you in…</p>}>
      <CallbackInner />
    </Suspense>
  );
}