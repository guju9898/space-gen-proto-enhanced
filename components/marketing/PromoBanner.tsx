"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { IntroPlanLink } from "@/components/marketing/IntroPlanLink"
import { Button } from "@/components/ui/button"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import {
  advertisedIntroCampaign,
  canUsePromoPreview,
  previewIntroCampaign,
  type PricingCampaign,
} from "@/lib/pricing/promotions"

const STORAGE_KEY = "renderspace_promo_hidden"

const MARKETING_PATHS = ["/", "/gallery", "/pricing", "/faq", "/contractor-demo", "/mockup-method"]

function formatCountdown(ms: number): string {
  if (ms <= 0) return "Ended"
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const mins = Math.floor((totalSec % 3600) / 60)
  const secs = totalSec % 60
  if (days > 0) return `${days}d ${hours}h ${mins}m`
  return `${hours}h ${mins}m ${secs}s`
}

/**
 * Sitewide promo banner for a live Intro campaign (Black Friday when the public
 * flag is on). Marketing pages + demo Studio only — never sign-in, onboarding or checkout.
 * `?promo_preview=1` forces the BF campaign on preview/dev builds only.
 */
export function PromoBanner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [now, setNow] = useState(() => Date.now())
  const [visible, setVisible] = useState(false)

  const campaign: PricingCampaign | null = useMemo(() => {
    const previewRequested = searchParams?.get("promo_preview") === "1"
    if (previewRequested && canUsePromoPreview()) {
      return previewIntroCampaign()
    }
    if (previewRequested && !canUsePromoPreview()) {
      // Ignored in production.
      return advertisedIntroCampaign(new Date())
    }
    return advertisedIntroCampaign(new Date())
  }, [searchParams])

  useEffect(() => {
    if (!campaign) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [campaign])

  useEffect(() => {
    if (!campaign) {
      setVisible(false)
      return
    }
    if (now >= Date.parse(campaign.endsAt)) {
      setVisible(false)
      return
    }
    try {
      if (localStorage.getItem(`${STORAGE_KEY}:${campaign.id}`)) {
        setVisible(false)
        return
      }
    } catch {
      // ignore
    }
    const loginOpen = searchParams?.get("login") != null
    const isMarketingPage = pathname != null && MARKETING_PATHS.includes(pathname)
    const isDemoStudio = pathname?.startsWith("/studio") && searchParams?.get("demo") === "true"
    const blocked =
      pathname?.startsWith("/onboarding") ||
      pathname?.startsWith("/auth") ||
      pathname === "/payment"
    setVisible(!loginOpen && !blocked && Boolean(isMarketingPage || isDemoStudio))
  }, [campaign, pathname, searchParams, now])

  if (!campaign || !visible) return null

  const remaining = Date.parse(campaign.endsAt) - now
  if (remaining <= 0) return null

  const firstWeekCents =
    campaign.amountOffCents != null
      ? Math.max(0, CATALOG.intro.amountCents - campaign.amountOffCents)
      : CATALOG.intro.amountCents

  return (
    <div
      className="fixed z-40 max-w-sm rounded-xl border border-border bg-card p-4 shadow-lg sm:bottom-6 sm:right-6 sm:left-auto bottom-4 left-1/2 -translate-x-1/2 sm:translate-x-0"
      role="region"
      aria-label={`${CATALOG.intro.name} offer`}
    >
      <button
        type="button"
        onClick={() => {
          setVisible(false)
          try {
            localStorage.setItem(`${STORAGE_KEY}:${campaign.id}`, "true")
          } catch {
            // ignore
          }
        }}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss offer"
      >
        <X className="h-4 w-4" />
      </button>
      <h3 className="pr-8 text-base font-semibold text-foreground">
        {moneyFromCents(firstWeekCents)} first week, then {moneyFromCents(CATALOG.intro.amountCents)}/week
      </h3>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {moneyFromCents(campaign.amountOffCents ?? 0)} off your first {CATALOG.intro.name} charge. Applied at
        checkout.
      </p>
      <p className="mt-2 text-xs font-medium text-foreground" role="timer" aria-live="polite">
        Ends in {formatCountdown(remaining)}
      </p>
      <Button
        asChild
        className="mt-4 w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white rounded-md font-medium"
      >
        <IntroPlanLink>Start the {CATALOG.intro.name}</IntroPlanLink>
      </Button>
    </div>
  )
}
