"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { CATALOG } from "@/lib/pricing/catalog"
import { withIntroPromotion } from "@/components/marketing/IntroPlanLink"
import { trackPricingEvent } from "@/components/conversion/group-3/analytics"
import {
  QUIZ_STEPS,
  quizPlanBlurb,
  quizPlanHref,
  quizProgress,
  scoreQuiz,
} from "@/lib/pricing/quiz"

const VOLUME_OPTIONS = [
  { label: "1–2", value: 2 },
  { label: "3–5", value: 4 },
  { label: "6–10", value: 8 },
  { label: "11+", value: 15 },
]

const RENDERS_OPTIONS = [
  { label: "1", value: 1 },
  { label: "2–3", value: 2 },
  { label: "4–5", value: 4 },
  { label: "6+", value: 6 },
]

/**
 * Three-step plan quiz with a progress meter. Uses recommendPlan under the hood.
 */
export function PlanQuiz() {
  const [step, setStep] = useState(0)
  const [projectsPerMonth, setProjects] = useState(4)
  const [rendersPerProject, setRenders] = useState(2)
  const [team, setTeam] = useState(false)
  const [done, setDone] = useState(false)

  const result = useMemo(
    () => scoreQuiz({ projectsPerMonth, rendersPerProject, team }),
    [projectsPerMonth, rendersPerProject, team]
  )

  const meter = quizProgress(done ? QUIZ_STEPS.length : step)

  function finish() {
    setDone(true)
    trackPricingEvent("plan_recommended", { plan: result.plan })
  }

  const href =
    result.plan === "intro" ? withIntroPromotion(quizPlanHref("intro")) : quizPlanHref(result.plan)

  return (
    <div className="max-w-3xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/60 p-6 mb-10">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-white font-semibold">Which plan fits?</h3>
        <span className="text-xs text-muted-foreground">{meter}%</span>
      </div>
      <div
        className="h-2 rounded-full bg-muted overflow-hidden mb-6"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={meter}
        aria-label="Quiz progress"
      >
        <div className="h-full bg-gradient-to-r from-orange-500 to-violet-700 transition-all" style={{ width: `${meter}%` }} />
      </div>

      {!done && step === 0 && (
        <fieldset>
          <legend className="text-sm font-medium text-white mb-1">{QUIZ_STEPS[0].title}</legend>
          <p className="text-xs text-muted-foreground mb-3">{QUIZ_STEPS[0].hint}</p>
          <div className="flex flex-wrap gap-2">
            {VOLUME_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setProjects(opt.value)
                  setStep(1)
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {!done && step === 1 && (
        <fieldset>
          <legend className="text-sm font-medium text-white mb-1">{QUIZ_STEPS[1].title}</legend>
          <p className="text-xs text-muted-foreground mb-3">{QUIZ_STEPS[1].hint}</p>
          <div className="flex flex-wrap gap-2">
            {RENDERS_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => {
                  setRenders(opt.value)
                  setStep(2)
                }}
                className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button type="button" className="mt-4 text-xs text-muted-foreground underline" onClick={() => setStep(0)}>
            Back
          </button>
        </fieldset>
      )}

      {!done && step === 2 && (
        <fieldset>
          <legend className="text-sm font-medium text-white mb-1">{QUIZ_STEPS[2].title}</legend>
          <p className="text-xs text-muted-foreground mb-3">{QUIZ_STEPS[2].hint}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setTeam(false)
                finish()
              }}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              Just me
            </button>
            <button
              type="button"
              onClick={() => {
                setTeam(true)
                finish()
              }}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              My team
            </button>
          </div>
          <button type="button" className="mt-4 text-xs text-muted-foreground underline" onClick={() => setStep(1)}>
            Back
          </button>
        </fieldset>
      )}

      {done && (
        <div>
          <p className="text-white font-medium mb-1">Suggested: {CATALOG[result.plan].name}</p>
          <p className="text-sm text-muted-foreground mb-2">{result.reason}</p>
          <p className="text-sm text-muted-foreground mb-4">{quizPlanBlurb(result.plan)}</p>
          <Link
            href={href}
            onClick={() => trackPricingEvent("plan_selected", { plan: result.plan, interval: CATALOG[result.plan].interval })}
            className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Continue with {CATALOG[result.plan].name}
          </Link>
          <button
            type="button"
            className="ml-3 text-xs text-muted-foreground underline"
            onClick={() => {
              setDone(false)
              setStep(0)
            }}
          >
            Retake
          </button>
        </div>
      )}
    </div>
  )
}
