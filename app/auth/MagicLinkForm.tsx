"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

export default function MagicLinkForm({ redirectTo = "/studio" }: { redirectTo?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
      });
      if (error) {
        setError(error.message);
        setStatus("error");
        return;
      }
      setStatus("sent");
    } catch (err: any) {
      setError(err?.message ?? String(err));
      setStatus("error");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      {status !== "sent" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm text-muted-foreground">Email Address</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full p-3 rounded-md bg-[#0f1720] border border-[#1f2937] text-white"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full py-3 bg-gradient-to-r from-[#9747ff] to-[#8608fd] text-white rounded-md"
          >
            {status === "sending" ? "Sending…" : "Send magic link"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <div className="p-4 bg-[#071018] rounded-md">
          <h3 className="font-bold">Check your email</h3>
          <p className="text-sm text-muted-foreground">We sent a sign-in link to <strong>{email}</strong>. Open it to continue.</p>
        </div>
      )}
    </div>
  );
}
