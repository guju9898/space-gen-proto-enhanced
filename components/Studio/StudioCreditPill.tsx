"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Coins } from "lucide-react"
import { useAuth } from "@/components/auth/AuthContext"
import { cn } from "@/lib/utils"

type Status = { creditsRemaining: number | null; monthlyLimit: number | null; resetsAt: string | null; reason?: string | null }

function fmt(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

/**
 * Studio v2: balance and reset date in one pill (spec Phase 2). Refreshes when a render
 * finishes (ResultActionsV2 fires CREDITS_CHANGED_EVENT).
 */
export const CREDITS_CHANGED_EVENT = "rs-credits-changed"

export function StudioCreditPill({ className }: { className?: string }) {
  const { status: auth } = useAuth()
  const [status, setStatus] = useState<Status | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const bump = () => setRefreshKey((n) => n + 1)
    window.addEventListener(CREDITS_CHANGED_EVENT, bump)
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, bump)
  }, [])

  useEffect(() => {
    if (auth !== "authenticated") return
    let cancel = false
    fetch("/api/credits/status", { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<Status>) : null))
      .then((d) => {
        if (!cancel && d) setStatus(d)
      })
      .catch(() => undefined)
    return () => {
      cancel = true
    }
  }, [auth, refreshKey])

  if (auth !== "authenticated" || !status) return null
  if (status.creditsRemaining === null && !status.reason) return null

  const out = status.reason === "credits_exhausted" || status.reason === "intro_period_ended" || (status.creditsRemaining ?? 0) <= 0
  const resets = status.resetsAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(status.resetsAt))
    : null

  return (
    <Link
      href={out ? "/pricing" : "/profile"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs",
        out ? "border-destructive/50 text-destructive" : "border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Coins className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="font-medium text-foreground">{fmt(Math.max(0, status.creditsRemaining ?? 0))}</span>
      {status.monthlyLimit != null && <span>of {fmt(status.monthlyLimit)}</span>}
      <span>credits</span>
      {resets && <span>· reset {resets}</span>}
    </Link>
  )
}
