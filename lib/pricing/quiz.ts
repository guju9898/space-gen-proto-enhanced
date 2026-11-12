import { CATALOG, type PlanCode } from "@/lib/pricing/catalog"

/** Pricing-page plan quiz (spec section 3): three taps, then a plan sized to real credits. */
export const QUIZ_TRADES = [
  { id: "pools", label: "Pools and outdoor living" },
  { id: "landscaping", label: "Landscaping" },
  { id: "exteriors", label: "Remodeling and exteriors" },
  { id: "interiors", label: "Interiors" },
] as const

export const QUIZ_JOBS = [
  { id: "1-3", label: "1–3 jobs", value: 2 },
  { id: "4-10", label: "4–10 jobs", value: 7 },
  { id: "11-25", label: "11–25 jobs", value: 18 },
  { id: "26+", label: "26 or more", value: 35 },
] as const

export const QUIZ_OPTIONS = [
  { id: "1-2", label: "1–2 designs", value: 2 },
  { id: "3-5", label: "3–5 designs", value: 4 },
  { id: "6+", label: "6 or more", value: 8 },
] as const

const WEEKS_PER_MONTH = 52 / 12

export interface QuizResult {
  plan: PlanCode
  rendersPerMonth: number
  /** What the meter compares: renders in the plan's own period vs. its credits. */
  meter: { used: number; of: number; period: "week" | "month" }
  reason: string
}

/**
 * Intro Plan when about a week of credits covers a month of work (a low-risk start);
 * Professional up to its 500 monthly credits; Business above that. Estimates only.
 */
export function quizRecommendation(jobsPerMonth: number, designsPerJob: number): QuizResult {
  const rendersPerMonth = Math.max(0, Math.round(jobsPerMonth * designsPerJob))
  if (rendersPerMonth <= CATALOG.intro.credits) {
    const perWeek = Math.ceil(rendersPerMonth / WEEKS_PER_MONTH)
    return {
      plan: "intro",
      rendersPerMonth,
      meter: { used: Math.max(perWeek, Math.min(rendersPerMonth, CATALOG.intro.credits)), of: CATALOG.intro.credits, period: "week" },
      reason: `About ${rendersPerMonth} renders a month. One ${CATALOG.intro.name} week (${CATALOG.intro.credits} credits) covers a month of jobs at that pace, so you can try it on real work first.`,
    }
  }
  if (rendersPerMonth <= CATALOG.professional.credits) {
    return {
      plan: "professional",
      rendersPerMonth,
      meter: { used: rendersPerMonth, of: CATALOG.professional.credits, period: "month" },
      reason: `About ${rendersPerMonth} renders a month fits inside Professional's ${CATALOG.professional.credits} monthly credits.`,
    }
  }
  return {
    plan: "business",
    rendersPerMonth,
    meter: { used: rendersPerMonth, of: CATALOG.business.credits, period: "month" },
    reason: `About ${rendersPerMonth.toLocaleString("en-US")} renders a month is more than Professional's ${CATALOG.professional.credits}. Business includes ${CATALOG.business.credits.toLocaleString("en-US")}.`,
  }
}
