"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { X } from "lucide-react"

const DISMISS_KEY = "renderspace_intro_modal_dismissed"
const DISMISS_DAYS = 7

function getDismissedUntil(): number | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return null
    const t = parseInt(raw, 10)
    return Number.isFinite(t) ? t : null
  } catch {
    return null
  }
}

function setDismissed() {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
    localStorage.setItem(DISMISS_KEY, String(until))
  } catch {}
}

export function IntroModal() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const isOnboarding = pathname?.startsWith("/onboarding")
      const dismissedUntil = getDismissedUntil()
      if (dismissedUntil != null && Date.now() < dismissedUntil) {
        setChecked(true)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user && !isOnboarding) {
        setChecked(true)
        return
      }

      if (user) {
        const [profileRes, claimRes] = await Promise.all([
          supabase.from("profiles").select("current_plan, subscription_status").eq("id", user.id).single(),
          supabase.from("intro_offer_claims").select("user_id").eq("user_id", user.id).maybeSingle(),
        ])
        const hasActiveSub =
          profileRes.data?.current_plan &&
          ["intro", "professional", "business"].includes(profileRes.data.current_plan) &&
          (profileRes.data?.subscription_status === "active" ||
            profileRes.data?.subscription_status === "trialing")
        const alreadyClaimed = !!claimRes.data
        if (hasActiveSub || alreadyClaimed) {
          setChecked(true)
          return
        }
      }

      if (!cancelled) {
        setOpen(true)
        // TODO: analytics - intro_modal_viewed
      }
      setChecked(true)
    }

    run()
    return () => {
      cancelled = true
    }
  }, [pathname])

  const handleDismiss = () => {
    setDismissed()
    setOpen(false)
  }

  const handleStartIntro = () => {
    setOpen(false)
    // TODO: analytics - intro_modal_started
    router.push("/onboarding?step=3&plan=intro")
  }

  const handleShowFullPlans = () => {
    setDismissed()
    setOpen(false)
    router.push("/onboarding?step=3")
  }

  if (!checked || !open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleDismiss} aria-hidden />
      <div
        className="relative z-10 w-full max-w-md rounded-xl border border-[#343434] bg-[#191f33] p-6 shadow-xl"
        role="dialog"
        aria-labelledby="intro-modal-title"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded p-1 text-gray-400 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 id="intro-modal-title" className="text-xl font-semibold text-white pr-8">
          Test Renderspace on Your Next Estimate
        </h2>
        <p className="mt-3 text-sm text-gray-300">
          Get 40 credits for 7 days for $19.99. A low-risk way to try Renderspace on a real project.
        </p>
        <p className="mt-3 text-xs text-gray-400">
          Automatically renews into Professional at $99/month unless canceled before renewal.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={handleStartIntro}
            className="w-full rounded-md bg-gradient-to-r from-orange-500 to-violet-700 py-2.5 font-medium text-white hover:opacity-90 transition-opacity"
          >
            Start Intro Plan
          </button>
          <button
            type="button"
            onClick={handleShowFullPlans}
            className="w-full rounded-md border border-[#343434] py-2.5 font-medium text-gray-300 hover:bg-white/5 transition-colors"
          >
            Show Full Plans
          </button>
        </div>
      </div>
    </div>
  )
}
