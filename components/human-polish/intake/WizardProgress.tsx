"use client"

/**
 * Human Polish™ intake — progress indicator + draft recovery countdown.
 */

import { Check, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { INTAKE_STEP_IDS, INTAKE_STEP_META, type IntakeStepId } from "./intakeConfig"

interface WizardProgressProps {
  currentIndex: number
  maxVisitedIndex: number
  onStepSelect: (stepId: IntakeStepId) => void
  msRemaining: number
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function WizardProgress({
  currentIndex,
  maxVisitedIndex,
  onStepSelect,
  msRemaining,
}: WizardProgressProps) {
  const total = INTAKE_STEP_IDS.length
  const percent = Math.round(((currentIndex + 1) / total) * 100)
  const low = msRemaining <= 2 * 60 * 1000

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Step <span className="font-semibold text-white">{currentIndex + 1}</span> of {total}
        </p>
        <p
          className={cn(
            "flex items-center gap-1.5 text-xs",
            low ? "text-orange-300" : "text-muted-foreground",
          )}
          title="Your draft is saved and can be recovered until this timer runs out."
        >
          <Clock className="h-3.5 w-3.5" />
          Draft saved · {formatCountdown(msRemaining)}
        </p>
      </div>

      <Progress value={percent} className="h-1.5 bg-[#191f33]" />

      <ol className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 md:flex">
        {INTAKE_STEP_IDS.map((id, index) => {
          const meta = INTAKE_STEP_META[id]
          const done = index < currentIndex
          const active = index === currentIndex
          const reachable = index <= maxVisitedIndex
          return (
            <li key={id}>
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onStepSelect(id)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium transition-colors",
                  active ? "text-white" : done ? "text-orange-300" : "text-muted-foreground",
                  reachable ? "cursor-pointer hover:text-white" : "cursor-not-allowed opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
                    active
                      ? "border-orange-500 bg-orange-500/20 text-white"
                      : done
                        ? "border-orange-400/60 bg-orange-400/10 text-orange-300"
                        : "border-[#343434]",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {meta.shortLabel}
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
