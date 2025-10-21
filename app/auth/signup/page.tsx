"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export default function SignupPage() {
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
            ? `${window.location.origin}/auth/callback?redirectTo=%2Fonboarding`
            : undefined,
      },
    });

    if (error) setStatus(`Error: ${error.message}`);
    else setStatus("Check your email for the login link.");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground px-4">
      <div className="w-full max-w-md p-6 bg-[#0f1720]/60 rounded-lg">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">Sign up</h1>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 rounded-md bg-[#0f1720] border border-[#1f2937] text-white"
            autoComplete="email"
          />
          <button type="submit" className="w-full py-3 bg-gradient-to-r from-[#9747ff] to-[#8608fd] text-white rounded-md">
            Send magic link
          </button>
          {status && <p className="text-sm text-gray-400">{status}</p>}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <a href="/auth/login" className="text-primary hover:underline">
              Log in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}