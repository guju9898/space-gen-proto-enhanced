"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Sending magic link...");
    const supabase = getSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    if (error) setStatus(`Error: ${error.message}`);
    else setStatus("Check your email for the login link.");
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border rounded p-2"
        autoComplete="email"
      />
      <button type="submit" className="w-full border rounded p-2">Send magic link</button>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </form>
  );
}