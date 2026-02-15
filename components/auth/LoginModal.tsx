"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "./AuthContext"
import { Mail, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ModalState = "idle" | "submitting" | "email_sent"

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { redirectAfterLogin } = useAuth()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<ModalState>("idle")
  const [error, setError] = useState<string | null>(null)

  const nextPath = redirectAfterLogin || "/studio/interior"
  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "/auth/callback"

  /** Set cookie so callback can redirect after magic link (Supabase often strips query params from email link) */
  const setRedirectCookie = (path: string) => {
    if (typeof document === "undefined") return
    document.cookie = `auth_redirect_next=${encodeURIComponent(path)}; path=/; max-age=600; SameSite=Lax`
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    setState("submitting")
    setRedirectCookie(nextPath)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      })

      if (signInError) {
        setError(signInError.message || "Failed to send magic link")
        setState("idle")
        return
      }

      setState("email_sent")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setState("idle")
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setState("submitting")
    setRedirectCookie(nextPath)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
        },
      })

      if (signInError) {
        setError(signInError.message || "Failed to sign in with Google")
        setState("idle")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setState("idle")
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset state after a brief delay to allow animation
    setTimeout(() => {
      setState("idle")
      setEmail("")
      setError(null)
    }, 150)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a] border border-[#1a1a1a] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Log in</DialogTitle>
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Log in</h2>
            <button
              onClick={() => handleClose()}
              className="text-muted-foreground hover:text-white transition-colors rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>

          {state === "email_sent" ? (
            /* Email Sent State */
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-[#1a1a1a] rounded-full mx-auto mb-4">
                <Mail className="h-8 w-8 text-[#9747ff]" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-white">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a magic link to <span className="text-white font-medium">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to log in.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => handleClose()}
                className="w-full mt-6 border-[#1a1a1a] text-muted-foreground hover:text-white hover:bg-[#1a1a1a]"
              >
                Close
              </Button>
            </div>
          ) : (
            /* Default / Submitting State */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Email address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={state === "submitting"}
                  className="bg-[#0a0a0a] border-[#1a1a1a] text-white placeholder:text-muted-foreground focus:border-[#9747ff] focus:ring-[#9747ff]"
                  required
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={state === "submitting" || !email}
                className={cn(
                  "w-full bg-gradient-to-r from-[#9747ff] to-[#8608fd] hover:opacity-90 text-white font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150 ease-out"
                )}
              >
                {state === "submitting" ? "Sending..." : "Log in"}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#1a1a1a]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0a] px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleGoogleSignIn()}
                disabled={state === "submitting"}
                className={cn(
                  "w-full border-[#1a1a1a] text-white hover:bg-[#1a1a1a]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all duration-150 ease-out"
                )}
              >
                Log in with Google
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    handleClose()
                    // Navigate to onboarding - but don't do it here, let parent handle it
                    window.location.href = "/onboarding"
                  }}
                  className="text-[#9747ff] hover:text-[#8608fd] font-medium transition-colors"
                >
                  Sign up
                </button>
              </p>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

