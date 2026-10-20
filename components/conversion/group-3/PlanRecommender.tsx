"use client"

import { useState } from "react"
import Link from "next/link"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { recommendPlan } from "@/lib/pricing/recommend"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"

export function PlanRecommender() {
  const [projects, setProjects] = useState("4")
  const [renders, setRenders] = useState("8")
  const [team, setTeam] = useState(false)
  const [services, setServices] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof recommendPlan> | null>(null)

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const recommendation = recommendPlan({
      projectsPerMonth: Number(projects),
      rendersPerProject: Number(renders),
      team,
      wantsProfessionalServices: services,
    })
    setResult(recommendation)
    trackPricingEvent("plan_recommended", { plan: recommendation.plan })
  }

  const plan = result ? CATALOG[result.plan] : null

  return (
    <form onSubmit={onSubmit} className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-6 mb-10">
      <h3 className="text-xl font-semibold text-white mb-1">Which plan fits?</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Uses the credit amounts on the plans above. It does not estimate revenue.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="text-sm text-muted-foreground">
          Projects per month
          <input
            type="number"
            min={0}
            max={10000}
            value={projects}
            onChange={(event) => setProjects(event.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-[#343434] bg-[#101010] px-3 text-white"
          />
        </label>
        <label className="text-sm text-muted-foreground">
          Renderings per project
          <input
            type="number"
            min={0}
            max={10000}
            value={renders}
            onChange={(event) => setRenders(event.target.value)}
            className="mt-1 w-full h-10 rounded-md border border-[#343434] bg-[#101010] px-3 text-white"
          />
        </label>
      </div>
      <div className="flex flex-col gap-2 mt-4 text-sm text-muted-foreground">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={team} onChange={(event) => setTeam(event.target.checked)} />
          More than one person will use the account
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={services} onChange={(event) => setServices(event.target.checked)} />
          I also need done-for-you presentation work
        </label>
      </div>
      <button
        type="submit"
        className="mt-4 h-10 px-4 rounded-md bg-gradient-to-r from-orange-500 to-violet-700 text-white text-sm font-medium"
      >
        Recommend a plan
      </button>
      {result && plan && (
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="text-white font-medium">
            {plan.name} · {moneyFromCents(plan.amountCents)} / {plan.interval}
          </p>
          <p className="mt-1">{result.reason}</p>
          {result.serviceNote && <p className="mt-1">{result.serviceNote}</p>}
          <Link
            href={`/onboarding?plan=${plan.code === "intro" ? "intro" : plan.code}&step=3`}
            onClick={() => trackPricingEvent("plan_selected", { plan: plan.code, status: "recommender" })}
            className="inline-flex mt-3 text-primary hover:underline"
          >
            Continue with {plan.name}
          </Link>
        </div>
      )}
    </form>
  )
}
