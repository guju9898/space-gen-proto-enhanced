"use client"

import { useEffect, useState } from "react"
import { Columns2, Lock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CompareSlider } from "@/components/Studio/CompareSlider"
import { cn } from "@/lib/utils"
import { toDateInputValue } from "@/lib/projects/presenting"

export const DEMO_PRESENTING_KEY = "rs_demo_presenting"

export type DemoPresentingChoice = "today" | "week" | "exploring" | "skipped"

export interface DemoPresentingHint {
  choice: DemoPresentingChoice
  /** ISO date (YYYY-MM-DD) for today / this week; absent otherwise. */
  date?: string
}

const OPTIONS: { id: Exclude<DemoPresentingChoice, "skipped">; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "exploring", label: "Just exploring" },
]

/** "This week" hint: three days out. A hint only, never shown as a promise. */
function hintFor(choice: DemoPresentingChoice, now = new Date()): DemoPresentingHint {
  if (choice === "today") return { choice, date: toDateInputValue(now) }
  if (choice === "week") {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3)
    return { choice, date: toDateInputValue(d) }
  }
  return { choice }
}

export function readDemoPresenting(): DemoPresentingHint | null {
  try {
    const raw = sessionStorage.getItem(DEMO_PRESENTING_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DemoPresentingHint
    return parsed && typeof parsed.choice === "string" ? parsed : null
  } catch {
    return null
  }
}

function writeDemoPresenting(hint: DemoPresentingHint) {
  try {
    sessionStorage.setItem(DEMO_PRESENTING_KEY, JSON.stringify(hint))
  } catch {
    /* storage blocked: the choice lasts for this page view */
  }
}

export interface DemoResultBarProps {
  rendersRemaining: number
  hasPhoto: boolean
  sourceImageUrl?: string | null
  resultImageUrl?: string | null
  /** Custom compare handler. When omitted, the bar opens its own compare dialog. */
  onCompare?: () => void
  /** Opens the plan / limit dialog. `reason` is the meeting-based line to show with it. */
  onUpgrade: (reason?: string) => void
  className?: string
}

function sendLine(choice: DemoPresentingChoice | null): string {
  if (choice === "today") return "Unlock Send to client before your meeting today"
  if (choice === "week") return "Unlock Send to client before your meeting this week"
  return "Unlock Send to client when you start a plan"
}

/**
 * Demo-mode result bar: asks once when they're showing this to a client, offers compare,
 * and shows a locked "Send to client" that opens the plan dialog. Credits are untouched;
 * the carry-over line matches what /api/demo/claim does at signup.
 */
export function DemoResultBar({
  rendersRemaining,
  hasPhoto,
  sourceImageUrl,
  resultImageUrl,
  onCompare,
  onUpgrade,
  className,
}: DemoResultBarProps) {
  const [hint, setHint] = useState<DemoPresentingHint | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  useEffect(() => {
    setHint(readDemoPresenting())
    setLoaded(true)
  }, [])

  const choose = (choice: DemoPresentingChoice) => {
    const next = hintFor(choice)
    setHint(next)
    writeDemoPresenting(next)
  }

  const canCompare = hasPhoto && Boolean(sourceImageUrl) && Boolean(resultImageUrl)
  const left = Math.max(0, rendersRemaining)

  return (
    <div className={cn("space-y-3", className)}>
      {loaded && !hint && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium">When are you showing this to a client?</p>
            <button
              type="button"
              onClick={() => choose("skipped")}
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Skip
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {OPTIONS.map((o) => (
              <Button key={o.id} type="button" size="sm" variant="outline" onClick={() => choose(o.id)}>
                {o.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {resultImageUrl && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            className="gap-2"
            onClick={() => onUpgrade(sendLine(hint?.choice ?? null))}
          >
            <Lock className="h-4 w-4" aria-hidden="true" />
            <Send className="h-4 w-4" aria-hidden="true" />
            Send to client
          </Button>
          {canCompare && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-2"
              onClick={() => (onCompare ? onCompare() : setCompareOpen(true))}
            >
              <Columns2 className="h-4 w-4" aria-hidden="true" />
              Compare with photo
            </Button>
          )}
        </div>
      )}

      {resultImageUrl && hint && hint.choice !== "skipped" && hint.choice !== "exploring" && (
        <p className="text-xs text-muted-foreground">{sendLine(hint.choice)}.</p>
      )}

      <p className="text-xs text-muted-foreground">
        {left} free render{left === 1 ? "" : "s"} left · your renders come with you when you start a plan
      </p>

      {canCompare && !onCompare && (
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogContent className="max-h-[95dvh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Photo and render</DialogTitle>
              <DialogDescription>Drag across the image, or use the slider, to compare.</DialogDescription>
            </DialogHeader>
            <CompareSlider beforeSrc={sourceImageUrl as string} afterSrc={resultImageUrl as string} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
