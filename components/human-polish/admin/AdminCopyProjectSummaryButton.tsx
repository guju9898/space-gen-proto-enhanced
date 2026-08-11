"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { buildHumanPolishProjectSummary, type ProjectSummaryInput } from "@/lib/human-polish/project-summary"

type Props = {
  summary: ProjectSummaryInput
}

export function AdminCopyProjectSummaryButton({ summary }: Props) {
  const [pending, startTransition] = useTransition()
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")

  function onCopy() {
    startTransition(async () => {
      try {
        const text = buildHumanPolishProjectSummary(summary)
        await navigator.clipboard.writeText(text)
        setState("copied")
        window.setTimeout(() => setState("idle"), 2500)
      } catch {
        setState("error")
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={onCopy}>
        {pending ? "Copying…" : "Copy project summary"}
      </Button>
      {state === "copied" ? (
        <span className="text-sm text-emerald-400" role="status">
          Copied
        </span>
      ) : null}
      {state === "error" ? (
        <span className="text-sm text-red-400" role="status">
          Copy failed — try again
        </span>
      ) : null}
    </div>
  )
}
