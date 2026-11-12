"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { IntroPlanLink } from "@/components/marketing/IntroPlanLink"
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
  const offerName = campaign.id === "black-friday-2026" ? "Black Friday" : "Limited-time offer"
  const lastDay = new Date(Date.parse(campaign.endsAt) - 60_000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  })

  // Slim strip at the top of the page, in the document flow: it scrolls away with the
  // page, so it never covers the hero buttons or the phone bottom bar.
  return (
    <div
      role="region"
      aria-label={`${offerName} offer`}
      className="relative z-30 border-b border-orange-500/30 bg-gradient-to-r from-orange-600 to-violet-800 text-white"
    >
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 pl-4 pr-10 text-center text-xs sm:text-sm">
        <span className="font-semibold">
          {offerName}: your first {CATALOG.intro.name} week for {moneyFromCents(firstWeekCents)}
        </span>
        <span className="text-white/85">
          <span className="hidden sm:inline">
            then {moneyFromCents(CATALOG.intro.amountCents)}/week · ends {lastDay}, 11:59pm CT ·{" "}
          </span>
          <span className="sm:hidden">ends in </span>
          <span role="timer" aria-live="off" className="font-mono tabular-nums">
            {formatCountdown(remaining)}
          </span>
        </span>
        <IntroPlanLink className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-violet-900 hover:bg-white/90">
          Claim the {moneyFromCents(firstWeekCents)} week
        </IntroPlanLink>
      </div>
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
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:text-white"
        aria-label="Dismiss offer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
