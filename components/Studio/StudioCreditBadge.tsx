"use client"

import { useEffect, useState } from "react"
import { getCreditErrorMessage } from "@/lib/usage/errorMessages"

type CreditStatus = {
  creditsRemaining: number | null
  monthlyLimit: number | null
  reason?: string | null
}

function formatCredits(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** Shows the live allowance (for example 40, then 38.5) and the ended intro window. */
export function StudioCreditBadge({ remainingOverride }: { remainingOverride: number | null }) {
  const [status, setStatus] = useState<CreditStatus | null>(null)

  useEffect(() => {
    let cancel = false
    fetch("/api/credits/status", { credentials: "include" })
      .then(async (res) => (res.ok ? ((await res.json()) as CreditStatus) : null))
      .then((data) => {
        if (!cancel && data) setStatus(data)
      })
      .catch(() => {})
    return () => {
      cancel = true
    }
  }, [remainingOverride])

  if (status?.reason === "intro_period_ended" || status?.reason === "credits_exhausted") {
    return (
      <p className="text-sm text-destructive">
        {getCreditErrorMessage(status.reason)}{" "}
        <a href="/pricing" className="font-medium underline">
          Upgrade your plan
        </a>
      </p>
    )
  }

  const remaining = remainingOverride ?? status?.creditsRemaining ?? null
  if (remaining === null) return null
  const limit = status?.monthlyLimit

  return (
    <div className="text-sm text-muted-foreground">
      Credits remaining: <span className="font-medium text-foreground">{formatCredits(remaining)}</span>
      {limit != null ? ` of ${formatCredits(limit)}` : ""}
    </div>
  )
}
