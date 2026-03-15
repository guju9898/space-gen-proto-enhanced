"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "renderspace_promo_hidden"
const DELAY_MS = 5000

export function IntroPlanPromo() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return

    if (localStorage.getItem(STORAGE_KEY)) {
      return
    }

    const isContractorDemo = pathname === "/contractor-demo"
    const isDemoMode =
      typeof window !== "undefined" &&
      pathname?.startsWith("/studio") &&
      new URLSearchParams(window.location.search).get("demo") === "true"
    if (isContractorDemo || isDemoMode) {
      setVisible(true)
      return
    }

    const t = setTimeout(() => setVisible(true), DELAY_MS)
    return () => clearTimeout(t)
  }, [mounted, pathname])

  function handleDismiss() {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch (_) {}
  }

  if (!visible) return null

  return (
    <div
      className="fixed z-50 max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto bottom-4 left-1/2 -translate-x-1/2 sm:translate-x-0"
      role="dialog"
      aria-label="Intro Plan promotion"
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <h3 className="pr-8 text-base font-semibold text-foreground">
        ⚡ Flash Launch Offer
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Start the Intro Plan today for only $19.
      </p>
      <p className="mt-2 text-xs text-foreground/90 font-medium">
        Use code NEW15 at checkout to get 15% off.
      </p>
      <p className="mt-1 text-xs text-muted-foreground italic">
        Limited time launch promotion.
      </p>
      <Button
        asChild
        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white rounded-md font-medium"
      >
        <Link href="/onboarding">Start Intro Plan</Link>
      </Button>
    </div>
  )
}
