import { CATALOG, type PlanCode } from "@/lib/pricing/catalog"

export type RecommendInput = {
  projectsPerMonth: number
  rendersPerProject: number
  team: boolean
  wantsProfessionalServices: boolean
}

export type PlanRecommendation = {
  plan: PlanCode
  rendersPerMonth: number
  reason: string
  serviceNote: string | null
}

function clampCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(10000, Math.floor(value))
}

/**
 * Pick a real plan from monthly render volume and team use.
 * Intro is 40 credits a week. Professional is 500 a month. Business is 6,000 a month.
 */
export function recommendPlan(input: RecommendInput): PlanRecommendation {
  const projects = clampCount(input.projectsPerMonth)
  const perProject = clampCount(input.rendersPerProject)
  const rendersPerMonth = projects * perProject
  const serviceNote = input.wantsProfessionalServices
    ? "Human Polish is a separate done-for-you service. It is not included in these subscription credits."
    : null

  if (input.team || rendersPerMonth > CATALOG.professional.credits) {
    return {
      plan: "business",
      rendersPerMonth,
      reason: input.team
        ? `Team use is outside the individual plans. Business includes ${CATALOG.business.credits.toLocaleString("en-US")} credits a month. This estimate is ${rendersPerMonth.toLocaleString("en-US")} renders a month.`
        : `This estimate is ${rendersPerMonth.toLocaleString("en-US")} renders a month. Professional includes ${CATALOG.professional.credits} credits a month, so Business is the plan that covers it.`,
      serviceNote,
    }
  }

  if (!input.team && rendersPerMonth <= CATALOG.intro.credits) {
    return {
      plan: "intro",
      rendersPerMonth,
      reason: `This estimate is ${rendersPerMonth.toLocaleString("en-US")} renders a month. The First Job Test includes ${CATALOG.intro.credits} credits each week.`,
      serviceNote,
    }
  }

  return {
    plan: "professional",
    rendersPerMonth,
    reason: `This estimate is ${rendersPerMonth.toLocaleString("en-US")} renders a month. Professional includes ${CATALOG.professional.credits} credits a month.`,
    serviceNote,
  }
}
