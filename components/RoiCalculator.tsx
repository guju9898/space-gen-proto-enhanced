"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

const PLAN_PRICES = {
  starter: 19.99,
  professional: 99,
  business: 349,
} as const

type PlanKey = keyof typeof PLAN_PRICES

const PLAN_LABELS: Record<PlanKey, string> = {
  starter: "Starter (Tripwire): $19.99",
  professional: "Professional: $99",
  business: "Business: $349",
}

export default function RoiCalculator() {
  const [averageProjectValue, setAverageProjectValue] = useState(20000)
  const [projectsPerMonth, setProjectsPerMonth] = useState(6)
  const [closingRateIncrease, setClosingRateIncrease] = useState(10)
  const [plan, setPlan] = useState<PlanKey>("professional")

  const planCost = PLAN_PRICES[plan]
  const additionalRevenue =
    averageProjectValue * projectsPerMonth * (closingRateIncrease / 100)
  const roiMultiple = planCost > 0 ? additionalRevenue / planCost : 0

  const inputClasses =
    "w-full rounded-md bg-[#101010] border border-[#343434] px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"

  return (
    <div className="max-w-4xl mx-auto rounded-xl border border-[#343434] bg-[#191f33] p-8 mb-10">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Average Project Value ($)
            </label>
            <input
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={averageProjectValue}
              onChange={(e) =>
                setAverageProjectValue(Number(e.target.value) || 0)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Projects per Month
            </label>
            <input
              type="number"
              min={1}
              max={50}
              step={1}
              value={projectsPerMonth}
              onChange={(e) =>
                setProjectsPerMonth(Number(e.target.value) || 0)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Closing Rate Increase (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={closingRateIncrease}
              onChange={(e) =>
                setClosingRateIncrease(Number(e.target.value) || 0)
              }
              className={inputClasses}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1.5">
              Renderspace Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanKey)}
              className={inputClasses}
            >
              <option value="starter">{PLAN_LABELS.starter}</option>
              <option value="professional">{PLAN_LABELS.professional}</option>
              <option value="business">{PLAN_LABELS.business}</option>
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Estimated Monthly Upside
          </h3>
          <p className="text-3xl md:text-4xl font-bold text-white mb-4">
            ${additionalRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} / month
          </p>
          <p className="text-sm text-muted-foreground">
            Plan cost: <span className="font-semibold text-white">${planCost}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            ROI multiple: <span className="font-semibold text-white">{roiMultiple.toFixed(0)}x</span>
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            If Renderspace helps you close just one extra project every few months, it easily pays for itself.
          </p>
          <Link
            href="/onboarding"
            className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium w-fit"
          >
            Redesign Now <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
