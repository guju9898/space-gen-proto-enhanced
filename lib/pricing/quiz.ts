import { CATALOG, type PlanCode } from "@/lib/pricing/catalog"
import { recommendPlan, type PlanRecommendation } from "@/lib/pricing/recommend"

export type QuizAnswers = {
  /** Step 1: jobs / month */
  projectsPerMonth: number
  /** Step 2: concepts per job */
  rendersPerProject: number
  /** Step 3: solo vs team */
  team: boolean
}

export const QUIZ_STEPS = [
  {
    id: "volume",
    title: "How many jobs do you bid each month?",
    hint: "An estimate is fine.",
  },
  {
    id: "renders",
    title: "How many concepts do you usually need per job?",
    hint: "Most contractors use 1–3.",
  },
  {
    id: "team",
    title: "Who will use Renderspace?",
    hint: "Team seats need Business.",
  },
] as const

export function quizProgress(stepIndex: number): number {
  const total = QUIZ_STEPS.length
  const clamped = Math.min(Math.max(stepIndex, 0), total)
  return Math.round((clamped / total) * 100)
}

export function scoreQuiz(answers: QuizAnswers): PlanRecommendation {
  return recommendPlan({
    projectsPerMonth: answers.projectsPerMonth,
    rendersPerProject: answers.rendersPerProject,
    team: answers.team,
    wantsProfessionalServices: false,
  })
}

export function quizPlanHref(plan: PlanCode): string {
  if (plan === "intro") return "/onboarding?plan=intro&step=3"
  return `/onboarding?plan=${plan}&step=3`
}

export function quizPlanBlurb(plan: PlanCode): string {
  const p = CATALOG[plan]
  if (plan === "intro") {
    return `${p.name}: ${p.credits} credits each week.`
  }
  return `${p.name}: ${p.credits.toLocaleString("en-US")} credits a month.`
}
