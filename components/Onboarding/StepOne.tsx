"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface StepOneProps {
  email: string
  setEmail: (email: string) => void
}

export default function StepOne({ email, setEmail }: StepOneProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }
    setError(null)
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (signInError) {
        setError(signInError.message || "Failed to send magic link")
        setIsSubmitting(false)
        return
      }
      router.push("/onboarding?step=2")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <Mail size={32} className="text-[#ec4899]" />
      </div>

      <h2 className="text-xl md:text-2xl font-bold mb-2 text-center">Welcome to our platform</h2>
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Enter your email address to get started with the onboarding process.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-md">
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#ec4899] text-white"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] rounded-md text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Continue"}
        </button>
      </form>
    </div>
  )
}
