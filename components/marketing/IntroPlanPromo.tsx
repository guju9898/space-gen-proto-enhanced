"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { advertisedIntroCampaign } from "@/lib/pricing/promotions"

const STORAGE_KEY = "renderspace_promo_hidden"

const MARKETING_PATHS = ["/", "/gallery", "/pricing", "/faq", "/contractor-demo", "/mockup-method"]

function formatEnd(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  })
}

/**
 * Intro Plan promotion card. Renders only for a real campaign in
 * lib/pricing/promotions.ts (enabled, Stripe coupon named, inside its dates),
 * and shows that campaign's actual end date. With no such campaign it renders
 * nothing. Never shown on sign-in, onboarding or checkout screens.
 */
export function IntroPlanPromo() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [campaign] = useState(() => advertisedIntroCampaign(new Date()))

  useEffect(() => {
    if (!campaign) return
    try {
      if (localStorage.getItem(`${STORAGE_KEY}:${campaign.id}`)) return
    } catch {
      // Storage unavailable: still fine to show.
    }
    const loginOpen = searchParams?.get("login") != null
    const isMarketingPage = pathname != null && MARKETING_PATHS.includes(pathname)
    const isDemoStudio = pathname?.startsWith("/studio") && searchParams?.get("demo") === "true"
    setVisible(!loginOpen && Boolean(isMarketingPage || isDemoStudio))
  }, [campaign, pathname, searchParams])

  if (!campaign || !visible) return null

  function handleDismiss() {
    setVisible(false)
    try {
      localStorage.setItem(`${STORAGE_KEY}:${campaign!.id}`, "true")
    } catch {
      // ignore
    }
  }

  const off =
    campaign.percentOff !== null
      ? `${campaign.percentOff}% off`
      : `${moneyFromCents(campaign.amountOffCents ?? 0)} off`
  const firstOnly = campaign.duration === "once" ? " your first charge" : ""

  return (
    <div
      className="fixed z-40 max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto bottom-4 left-1/2 -translate-x-1/2 sm:translate-x-0"
      role="region"
      aria-label={`${CATALOG.intro.name} offer`}
    >
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss offer"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="pr-8 text-base font-semibold text-foreground">
        {off}
        {firstOnly} of the {CATALOG.intro.name}
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Normally {moneyFromCents(CATALOG.intro.amountCents)} a week. Applied automatically at checkout.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Ends {formatEnd(campaign.endsAt)}.</p>
      <Button
        asChild
        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white rounded-md font-medium"
      >
        <Link href={`/onboarding?plan=intro&step=3&promotion=${encodeURIComponent(campaign.id)}`}>
          Start the {CATALOG.intro.name}
        </Link>
      </Button>
    </div>
  )
}
