"use client"

import { useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { QUIZ_JOBS, QUIZ_OPTIONS, QUIZ_TRADES, quizRecommendation } from "@/lib/pricing/quiz"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"
import { cn } from "@/lib/utils"

const choice = (on: boolean) =>
  cn(
    "min-h-[44px] rounded-md border px-3 py-2 text-left text-sm transition-colors",
    on ? "border-orange-500 bg-orange-500/10 text-white" : "border-[#343434] text-muted-foreground hover:text-white hover:border-white/30"
  )

/** "Pick your plan in 30 seconds": trade, jobs a month, designs per job → a plan and a usage meter. */
export function PlanQuiz() {
  const [trade, setTrade] = useState<string | null>(null)
  const [jobs, setJobs] = useState<number | null>(null)
  const [designs, setDesigns] = useState<number | null>(null)
  const result = jobs !== null && designs !== null ? quizRecommendation(jobs, designs) : null
  const plan = result ? CATALOG[result.plan] : null
  const pct = result ? Math.min(100, Math.round((result.meter.used / result.meter.of) * 100)) : 0

  return (
    <section aria-labelledby="plan-quiz" className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-6 mb-10">
      <h3 id="plan-quiz" className="text-xl font-semibold text-white">Pick your plan in 30 seconds</h3>
      <p className="mt-1 text-sm text-muted-foreground">Three taps. Based on the credits each plan includes; 1 credit = 1 Studio render.</p>

      <ol className="mt-5 space-y-5">
        <li>
          <p className="mb-2 text-sm font-medium text-white">1. What do you build?</p>
          <div className="grid grid-cols-2 gap-2">
            {QUIZ_TRADES.map((t) => (
              <button key={t.id} type="button" aria-pressed={trade === t.id} className={choice(trade === t.id)} onClick={() => setTrade(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </li>
        <li>
          <p className="mb-2 text-sm font-medium text-white">2. How many jobs do you quote a month?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUIZ_JOBS.map((j) => (
              <button key={j.id} type="button" aria-pressed={jobs === j.value} className={choice(jobs === j.value)} onClick={() => setJobs(j.value)}>
                {j.label}
              </button>
            ))}
          </div>
        </li>
        <li>
          <p className="mb-2 text-sm font-medium text-white">3. How many design options do you show per job?</p>
          <div className="grid grid-cols-3 gap-2">
            {QUIZ_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={designs === o.value}
                className={choice(designs === o.value)}
                onClick={() => {
                  setDesigns(o.value)
                  if (jobs !== null) trackPricingEvent("plan_recommended", { plan: quizRecommendation(jobs, o.value).plan, status: "quiz" })
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </li>
      </ol>

      {result && plan && (
        <div className="mt-6 rounded-lg border border-orange-500/40 bg-[#101010]/60 p-4" aria-live="polite">
          <p className="flex items-center gap-2 font-semibold text-white">
            <Check className="h-4 w-4 text-orange-400" aria-hidden="true" />
            {plan.name} · {moneyFromCents(plan.amountCents)} / {plan.interval}
          </p>
          <div className="mt-3">
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#343434]">
              <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-violet-600" style={{ width: `${Math.max(4, pct)}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              About {result.meter.used.toLocaleString("en-US")} of {result.meter.of.toLocaleString("en-US")} credits a {result.meter.period}
            </p>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{result.reason}</p>
          <Link
            href={`/onboarding?plan=${plan.code}&step=3`}
            onClick={() => trackPricingEvent("plan_selected", { plan: plan.code, status: "quiz" })}
            className="mt-3 inline-flex rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue with {plan.name}
          </Link>
          <p className="mt-2 text-xs text-muted-foreground">An estimate from your answers, not a promise of results.</p>
        </div>
      )}
    </section>
  )
}
