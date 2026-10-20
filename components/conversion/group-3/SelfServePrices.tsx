"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CATALOG, introDisclosure, moneyFromCents, savingsCents } from "@/lib/pricing/catalog"
import { BillingIntervalToggle } from "@/components/conversion/group-3/BillingIntervalToggle"
import { PlanRecommender } from "@/components/conversion/group-3/PlanRecommender"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"

export function SelfServePrices() {
  const [interval, setInterval] = useState<"month" | "year">("month")
  const [annualCents, setAnnualCents] = useState<{ professional: number | null; business: number | null }>({
    professional: null,
    business: null,
  })
  const [rollsIntoProfessional, setRollsIntoProfessional] = useState(false)
  const intro = CATALOG.intro
  const disclosure = introDisclosure(rollsIntoProfessional)

  useEffect(() => {
    let cancelled = false
    fetch("/api/pricing/offers")
      .then((response) => (response.ok ? response.json() : null))
      .then(
        (
          data: {
            annual?: {
              professional?: { amountCents?: number | null }
              business?: { amountCents?: number | null }
            }
            rollsIntoProfessional?: boolean
          } | null
        ) => {
          if (cancelled || !data) return
          setAnnualCents({
            professional: typeof data.annual?.professional?.amountCents === "number" ? data.annual.professional.amountCents : null,
            business: typeof data.annual?.business?.amountCents === "number" ? data.annual.business.amountCents : null,
          })
          setRollsIntoProfessional(Boolean(data.rollsIntoProfessional))
        }
      )
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const annualReady = annualCents.professional !== null || annualCents.business !== null

  const priceLabel = (code: "professional" | "business") => {
    const yearly = annualCents[code]
    if (interval === "year" && yearly !== null) return `${moneyFromCents(yearly)} / year`
    return `${moneyFromCents(CATALOG[code].amountCents)} / month`
  }

  return (
    <>
      <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/60 p-5 mb-6 text-center relative">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
          First Job Test
        </span>
        <p className="text-sm text-muted-foreground">
          Charged today: <span className="font-semibold text-white">{moneyFromCents(disclosure.chargedTodayCents)}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {intro.credits} credits each week. Renews every week.
        </p>
        <p className="text-xs text-muted-foreground mt-2">{disclosure.renewal}</p>
        <p className="text-xs text-muted-foreground mt-1">{disclosure.cancellation} {disclosure.notOneTime}</p>
        <Link
          href="/onboarding?plan=intro&step=3"
          onClick={() => trackPricingEvent("plan_selected", { plan: "intro", interval: "week" })}
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Start weekly for {moneyFromCents(intro.amountCents)}
        </Link>
      </div>

      <BillingIntervalToggle value={interval} annualAvailable={annualReady} onChange={setInterval} />

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
        {(["professional", "business"] as const).map((code) => {
          const plan = CATALOG[code]
          const yearly = annualCents[code]
          const yearlySelected = interval === "year" && yearly !== null
          const saved = yearlySelected ? savingsCents(plan.amountCents, yearly) : 0
          return (
            <div key={code} className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434]">
              <h3 className="text-white font-bold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {yearlySelected ? "Annual subscription" : "Monthly subscription"}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{priceLabel(code)}</span>
                {saved > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {moneyFromCents(saved)} less than twelve monthly payments
                  </p>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-muted-foreground">{plan.credits.toLocaleString("en-US")} credits per month</li>
                <li className="text-sm text-muted-foreground">4K resolution</li>
                <li className="text-sm text-muted-foreground">All style options</li>
                <li className="text-sm text-muted-foreground">Use renders in proposals, marketing &amp; ads</li>
              </ul>
              <Link
                href={`/onboarding?plan=${code}&step=3${yearlySelected ? "&interval=year" : ""}`}
                onClick={() => trackPricingEvent("plan_selected", { plan: code, interval: yearlySelected ? "year" : "month" })}
                className="block text-center py-2 bg-gradient-to-r from-orange-500 to-violet-700 rounded-md text-white hover:opacity-90 transition-all"
              >
                Start with {plan.name}
              </Link>
            </div>
          )
        })}
      </div>

      <PlanRecommender />
    </>
  )
}
