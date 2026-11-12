"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CATALOG,
  MOST_POPULAR_PLAN,
  introDisclosure,
  moneyFromCents,
  perRenderLabel,
  savingsCents,
} from "@/lib/pricing/catalog"
import { advertisedIntroCampaign } from "@/lib/pricing/promotions"
import { BillingIntervalToggle } from "@/components/conversion/group-3/BillingIntervalToggle"
import { PlanQuiz } from "@/components/conversion/group-3/PlanQuiz"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"
import { IntroPlanLink } from "@/components/marketing/IntroPlanLink"

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ended"
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  return `${hours}h ${mins}m`
}

export function SelfServePrices() {
  const [interval, setInterval] = useState<"month" | "year">("month")
  const [annualCents, setAnnualCents] = useState<{ professional: number | null; business: number | null }>({
    professional: null,
    business: null,
  })
  const [rollsIntoProfessional, setRollsIntoProfessional] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const intro = CATALOG.intro
  const disclosure = introDisclosure(rollsIntoProfessional)
  const promo = useMemo(() => advertisedIntroCampaign(new Date(now)), [now])

  useEffect(() => {
    if (!promo) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [promo])

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

  const firstWeekCents =
    promo?.amountOffCents != null ? Math.max(0, intro.amountCents - promo.amountOffCents) : disclosure.chargedTodayCents
  const remaining = promo ? Date.parse(promo.endsAt) - now : 0

  return (
    <>
      <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/60 p-5 mb-6 text-center relative">
        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
          {intro.name}
        </span>
        {promo && remaining > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-white">{moneyFromCents(firstWeekCents)} first week</span>
              , then {moneyFromCents(intro.amountCents)}/week
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {intro.credits} credits each week. {perRenderLabel("intro")}.
            </p>
            <p className="mt-2 text-xs font-medium text-foreground" role="timer" aria-live="polite">
              Offer ends in {formatCountdown(remaining)}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Charged today: <span className="font-semibold text-white">{moneyFromCents(disclosure.chargedTodayCents)}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {intro.credits} credits each week. {perRenderLabel("intro")}. Renews every week.
            </p>
          </>
        )}
        <p className="text-xs text-muted-foreground mt-2">{disclosure.renewal}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {disclosure.cancellation} {disclosure.notOneTime}
        </p>
        <IntroPlanLink
          onClick={() => trackPricingEvent("plan_selected", { plan: "intro", interval: "week" })}
          className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Start weekly for {moneyFromCents(promo && remaining > 0 ? firstWeekCents : intro.amountCents)}
        </IntroPlanLink>
      </div>

      {annualReady && <BillingIntervalToggle value={interval} annualAvailable={annualReady} onChange={setInterval} />}

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-10">
        {(["professional", "business"] as const).map((code) => {
          const plan = CATALOG[code]
          const yearly = annualCents[code]
          const yearlySelected = interval === "year" && yearly !== null
          const saved = yearlySelected ? savingsCents(plan.amountCents, yearly) : 0
          const popular = code === MOST_POPULAR_PLAN
          return (
            <div key={code} className="bg-[#191f33]/50 rounded-xl p-6 border border-[#343434] relative">
              {popular && (
                <span className="absolute -top-2.5 right-4 bg-violet-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                  Most popular
                </span>
              )}
              <h3 className="text-white font-bold">{plan.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {yearlySelected ? "Annual subscription" : "Monthly subscription"}
              </p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">{priceLabel(code)}</span>
                <p className="text-xs text-muted-foreground mt-2">{perRenderLabel(code)}</p>
                {saved > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {moneyFromCents(saved)} less than twelve monthly payments
                  </p>
                )}
              </div>
              <ul className="space-y-2 mb-6">
                <li className="text-sm text-muted-foreground">{plan.credits.toLocaleString("en-US")} credits per month</li>
                <li className="text-sm text-muted-foreground">Full-size PNG downloads</li>
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

      <PlanQuiz />
    </>
  )
}
