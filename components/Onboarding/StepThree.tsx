"use client"

import { useEffect, useState } from "react"
import { CATALOG, introDisclosure, moneyFromCents } from "@/lib/pricing/catalog"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"

interface Plan {
  id: string
  name: string
  priceLabel: string
  credits: number
  description: string
  cadence: string
  badge?: string
  note?: string
  cta: string
  isPopular?: boolean
}

interface StepThreeProps {
  selectedPlan: string | null
  onSelectPlan: (planId: string) => void
}

export default function StepThree({ selectedPlan, onSelectPlan }: StepThreeProps) {
  const [rollsIntoProfessional, setRollsIntoProfessional] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/pricing/offers")
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { rollsIntoProfessional?: boolean } | null) => {
        if (!cancelled && data) setRollsIntoProfessional(Boolean(data.rollsIntoProfessional))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  const disclosure = introDisclosure(rollsIntoProfessional)
  const plans: Plan[] = [
    {
      id: "intro",
      name: CATALOG.intro.name,
      priceLabel: moneyFromCents(CATALOG.intro.amountCents),
      credits: CATALOG.intro.credits,
      description: "credits each week",
      cadence: "/ week",
      badge: "First Job Test",
      note: disclosure.renewal,
      cta: "Start weekly",
    },
    {
      id: "professional",
      name: CATALOG.professional.name,
      priceLabel: moneyFromCents(CATALOG.professional.amountCents),
      credits: CATALOG.professional.credits,
      description: "generations / credits per month",
      cadence: "/ month",
      cta: "Subscribe",
      isPopular: true,
    },
    {
      id: "business",
      name: CATALOG.business.name,
      priceLabel: moneyFromCents(CATALOG.business.amountCents),
      credits: CATALOG.business.credits,
      description: "generations / credits per month",
      cadence: "/ month",
      cta: "Subscribe",
    },
  ]

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-gray-400">
          Select the plan that best fits your design needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`relative rounded-lg border ${
              selectedPlan === plan.id
                ? plan.isPopular
                  ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/50"
                  : "border-[#ec4899]"
                : "border-gray-700 hover:border-gray-600"
            } p-5 transition-colors cursor-pointer ${
              plan.isPopular ? "bg-gray-800/80 border-gray-600" : ""
            }`}
            onClick={() => {
              onSelectPlan(plan.id)
              trackPricingEvent("plan_selected", {
                plan: plan.id,
                interval: plan.id === "intro" ? "week" : "month",
                status: "onboarding",
              })
            }}
          >
            {plan.badge && (
              <div className="absolute -top-3 right-4 bg-amber-600 text-white text-xs px-3 py-1 rounded-full">
                {plan.badge}
              </div>
            )}
            {plan.isPopular && (
              <div className="absolute -top-3 right-4 bg-[#8b5cf6] text-white text-xs px-3 py-1 rounded-full font-medium">
                Most Popular
              </div>
            )}

            <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
            <p className="text-xs text-gray-400 mb-4">
              {plan.id === "intro" ? "Weekly subscription" : "Monthly subscription"}
            </p>

            <div className="mb-4">
              <span className="text-2xl font-bold">{plan.priceLabel}</span>
              <span className="text-sm text-gray-400"> {plan.cadence}</span>
            </div>

            <p className="text-sm text-gray-400 mb-2">
              {plan.credits.toLocaleString("en-US")} {plan.description}
            </p>
            {plan.note ? (
              <p className="text-xs text-amber-400/90 mb-4">{plan.note}</p>
            ) : (
              <div className="mb-6" />
            )}

            <button
              className={`w-full py-2 rounded-md transition-colors ${
                selectedPlan === plan.id
                  ? "bg-gradient-to-r from-[#ec4899] to-[#8b5cf6] text-white"
                  : "bg-gray-800 text-white hover:bg-gray-700"
              }`}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
