"use client"

import { trackPricingEvent } from "@/components/conversion/group-3/analytics"

export function BillingIntervalToggle({
  value,
  annualAvailable,
  onChange,
}: {
  value: "month" | "year"
  annualAvailable: boolean
  onChange: (next: "month" | "year") => void
}) {
  const choose = (next: "month" | "year") => {
    if (next === "year" && !annualAvailable) return
    onChange(next)
    trackPricingEvent("billing_interval_selected", { interval: next, status: annualAvailable ? "available" : "unavailable" })
  }

  return (
    <div className="flex flex-col items-center gap-2 mb-8">
      <div role="group" aria-label="Billing frequency" className="inline-flex rounded-md border border-[#343434] p-1">
        <button
          type="button"
          aria-pressed={value === "month"}
          onClick={() => choose("month")}
          className={`h-10 px-4 rounded text-sm ${value === "month" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          Monthly
        </button>
        <button
          type="button"
          aria-pressed={value === "year"}
          disabled={!annualAvailable}
          onClick={() => choose("year")}
          className={`h-10 px-4 rounded text-sm disabled:opacity-50 ${value === "year" ? "bg-primary text-white" : "text-muted-foreground"}`}
        >
          Annual
        </button>
      </div>
      {!annualAvailable && (
        <p className="text-xs text-muted-foreground">Annual billing is not available yet.</p>
      )}
    </div>
  )
}
