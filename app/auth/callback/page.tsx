"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [message, setMessage] = useState("Finalizing sign-in...");

  const redirectTo = useMemo(() => {
    const raw = search?.get("redirectTo") || "/studio";
    try {
      const decoded = decodeURIComponent(raw);
      return decoded.startsWith("/") ? decoded : "/studio";
    } catch {
      return "/studio";
    }
  }, [search]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowserClient();

      const hash = (typeof window !== "undefined" && window.location.hash) || "";
      const query = (typeof window !== "undefined" && window.location.search) || "";

      const parseHash = (h: string) => {
        const out: Record<string, string> = {};
        const frag = h.startsWith("#") ? h.slice(1) : h;
        for (const part of frag.split("&")) {
          if (!part) continue;
          const [k, v] = part.split("=");
          if (!k) continue;
          out[decodeURIComponent(k)] = v ? decodeURIComponent(v) : "";
        }
        return out;
      };

      const hashParams = parseHash(hash);
      const access_token = hashParams["access_token"];
      const refresh_token = hashParams["refresh_token"];
      const error = hashParams["error"];
      const error_code = hashParams["error_code"];
      const error_description = hashParams["error_description"];

      const qs = new URLSearchParams(query);
      const code = qs.get("code");

      // === AUTH DEBUG START ===
      console.log("=== AUTH DEBUG START ===");
      console.log({
        pathname: typeof window !== "undefined" ? window.location.pathname : "",
        hash,
        query,
        parsedHash: { ...hashParams, access_token: !!access_token, refresh_token: !!refresh_token },
        codePresent: !!code,
        hasSetSession: typeof supabase.auth.setSession === "function",
        hasExchangeCodeForSession: typeof (supabase.auth as any).exchangeCodeForSession === "function",
        redirectTo,
      });
      console.log("=== AUTH DEBUG END ===");
      // === AUTH DEBUG END ===

      try {
        if (error) {
          setMessage(`Auth Error: ${error_code || error} – ${error_description || ""}`);
          return;
        }

        // 1) Magic link hash tokens → setSession
        if (access_token && refresh_token && typeof supabase.auth.setSession === "function") {
          const { error: setErr } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (setErr) {
            setMessage(`Failed to set session: ${setErr.message}`);
            return;
          }
          if (!cancelled) {
            setMessage("Signed in. Redirecting...");
            router.replace(redirectTo);
          }
          return;
        }

        // 2) OAuth/PKCE code → exchangeCodeForSession if available
        if (code && typeof (supabase.auth as any).exchangeCodeForSession === "function") {
          const { error: xErr } = await (supabase.auth as any).exchangeCodeForSession(code);
          if (xErr) {
            setMessage(`Failed to exchange code: ${xErr.message}`);
            return;
          }
          if (!cancelled) {
            setMessage("Signed in via code. Redirecting...");
            router.replace(redirectTo);
          }
          return;
        }

        // 3) Nothing useful in URL
        setMessage(
          "No session tokens found in URL. If you clicked an old link, request a new magic link."
        );
      } catch (e: any) {
        setMessage(`Unexpected error: ${e?.message || String(e)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [redirectTo]);

  return (
    <div className="mx-auto max-w-md p-6 text-sm text-gray-800">
      <p>{message}</p>
      <p className="mt-2 text-xs text-gray-500">
        If this page is stuck, open DevTools → Console, enable "Preserve log", reload,
        and copy logs between the === AUTH DEBUG START/END === markers.
      </p>
    </div>
  );
}