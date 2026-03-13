"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StepTwoProps {
  email: string
}

export default function StepTwo({ email }: StepTwoProps) {
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleResend = async () => {
    if (!email || !email.includes("@")) return
    setError(null)
    setIsResending(true)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signInError) {
        setError(signInError.message || "Failed to resend")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
        <Mail size={32} className="text-[#ec4899]" />
      </div>
      <h2 className="text-xl md:text-2xl font-bold mb-4 text-center">Check your email to continue</h2>
      <p className="text-gray-400 mb-6 text-center">
        We've sent a magic link to <span className="text-white font-medium">{email}</span>. Click the link in your
        email to continue.
      </p>
      <div className="p-4 bg-gray-800/50 rounded-md mb-6 text-sm text-gray-300 text-center max-w-md">
        <p>Didn't receive the email? Check your spam folder or click below to resend.</p>
      </div>
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      <button
        onClick={handleResend}
        disabled={isResending}
        className={`px-6 py-2 rounded-md transition-colors ${
          isResending ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-gray-800 hover:bg-gray-700 text-white"
        }`}
      >
        {isResending ? "Sending..." : "Resend Email"}
      </button>
    </div>
  )
}
