"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { trackStudioEvent } from "@/components/Studio/analytics"
import { IntroOfferLine, IntroPlanLink } from "@/components/marketing/IntroOfferInline"

export interface DemoLimitModalProps {
  open: boolean
  onClose: () => void
  /** The demo renders made in this browser, newest first. Shown next to the plan. */
  renders?: string[]
}

/**
 * After the fifth demo render (spec R12): the renders they made, next to the plan.
 * Everything stated here is true today: demo renders move into the account at signup
 * (/api/demo/claim), and the plan figures come from the pricing catalog.
 */
export function DemoLimitModal({ open, onClose, renders = [] }: DemoLimitModalProps) {
  const intro = CATALOG.intro
  const shown = Array.from(new Set(renders.filter(Boolean))).slice(0, 4)

  useEffect(() => {
    if (open) trackStudioEvent("demo_limit_viewed", { count: shown.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Keep this job and send the link</DialogTitle>
          <DialogDescription>
            {shown.length
              ? "You've used your 5 demo renders. These come with you: start a plan from this browser and they're saved to your account as a project, ready to send to the client."
              : "Start a plan to keep rendering. Demo renders made in this browser are saved to your account when you sign up."}
          </DialogDescription>
        </DialogHeader>

        {shown.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {shown.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`Demo render ${i + 1}`}
                className="aspect-[4/3] w-full rounded-md border border-border object-cover"
                loading="lazy"
              />
            ))}
          </div>
        )}

        <div className="rounded-lg border border-border p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold">{intro.name}</p>
            <p className="text-sm">
              <span className="text-lg font-semibold">{moneyFromCents(intro.amountCents)}</span>
              <span className="text-muted-foreground"> / week</span>
            </p>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              {intro.credits} render credits each week
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Renews weekly until you cancel
            </li>
            <li className="flex gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              Credits are only used when a render succeeds
            </li>
          </ul>
          <IntroOfferLine className="mt-3 text-sm font-medium text-orange-300" />
        </div>

        <div className="mt-1 flex flex-col gap-3 sm:flex-row">
          <Button asChild className="flex-1 bg-gradient-to-r from-orange-500 to-violet-700 text-white hover:opacity-90">
            <IntroPlanLink base="/onboarding?plan=intro">Start {intro.name}</IntroPlanLink>
          </Button>
          <Button asChild variant="outline" className="flex-1">
            <Link href="/pricing">Compare plans</Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
