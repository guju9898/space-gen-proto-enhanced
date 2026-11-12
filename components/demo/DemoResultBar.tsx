"use client"

import { useEffect, useState } from "react"
import { Columns2, Lock, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CompareSlider } from "@/components/Studio/CompareSlider"
import { IntroOfferLine, IntroPlanLink } from "@/components/marketing/IntroOfferInline"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { MEETING_OPTIONS, MEETING_STORAGE_KEY, isMeetingId, meetingNudge, type MeetingId } from "@/lib/studio/meeting"
import { trackStudioEvent } from "@/components/Studio/analytics"
import { cn } from "@/lib/utils"

function readMeeting(): MeetingId | "skipped" | null {
  try {
    const v = localStorage.getItem(MEETING_STORAGE_KEY)
    return v === "skipped" ? "skipped" : isMeetingId(v) ? v : null
  } catch {
    return null
  }
}

/**
 * Demo Studio, under the result (spec sections 1 and 3):
 * - one-tap "When are you showing this to a client?" (skippable, remembered in this browser)
 * - after a render: compare with the photo, renders-left line with the carry-over promise
 * - "Send to client" shown as a paid feature, with the Intro Plan (and live campaign) to unlock it
 */
export function DemoResultBar({
  currentRender,
  sourceImageUrl,
  rendersRemaining,
}: {
  currentRender: string | null
  sourceImageUrl: string | null
  rendersRemaining: number
}) {
  const [meeting, setMeeting] = useState<MeetingId | "skipped" | null>("skipped")
  const [compareOpen, setCompareOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)

  useEffect(() => setMeeting(readMeeting()), [])

  const answer = (value: MeetingId | "skipped") => {
    setMeeting(value)
    try {
      localStorage.setItem(MEETING_STORAGE_KEY, value)
    } catch {
      /* storage blocked */
    }
    trackStudioEvent("meeting_answered", { field: value })
  }

  const nudge = meetingNudge(isMeetingId(meeting) ? meeting : null)

  return (
    <div className="space-y-3">
      {meeting === null && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">When are you showing this to a client?</p>
            <button type="button" onClick={() => answer("skipped")} className="text-xs text-muted-foreground underline underline-offset-2">
              Skip
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {MEETING_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => answer(o.id)}
                className="min-h-[40px] rounded-md border border-border bg-background px-3 text-sm hover:border-primary"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {currentRender && (
        <>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="gap-2"
              onClick={() => {
                setSendOpen(true)
                trackStudioEvent("demo_limit_viewed", { field: "send_to_client" })
              }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
              Send to client
              <Lock className="h-3.5 w-3.5 opacity-80" aria-hidden="true" />
            </Button>
            {sourceImageUrl && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setCompareOpen(true)
                  trackStudioEvent("compare_opened", { mode: "demo" })
                }}
              >
                <Columns2 className="h-4 w-4" aria-hidden="true" />
                Compare with photo
              </Button>
            )}
          </div>
          <p className={cn("text-xs text-muted-foreground")}>
            {rendersRemaining > 0
              ? `${rendersRemaining} free render${rendersRemaining === 1 ? "" : "s"} left · your renders come with you when you start a plan.`
              : "Your demo renders come with you when you start a plan."}
          </p>
        </>
      )}

      {sourceImageUrl && currentRender && (
        <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
          <DialogContent className="max-h-[95dvh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Photo and render</DialogTitle>
              <DialogDescription>Drag across the image, or use the slider, to compare.</DialogDescription>
            </DialogHeader>
            <CompareSlider beforeSrc={sourceImageUrl} afterSrc={currentRender} />
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Keep this job and send the link</DialogTitle>
            <DialogDescription>{nudge}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li>· A view-only page with every version, ready to text or email</li>
            <li>· Your demo renders move into your account as a project</li>
            <li>
              · {CATALOG.intro.name}: {CATALOG.intro.credits} credits a week for {moneyFromCents(CATALOG.intro.amountCents)}
            </li>
          </ul>
          <IntroOfferLine className="text-sm font-medium text-orange-300" />
          <IntroPlanLink className="inline-flex justify-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Start the {CATALOG.intro.name}
          </IntroPlanLink>
        </DialogContent>
      </Dialog>
    </div>
  )
}
