"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { campaignFirstChargeCents, introCampaignToShow, promoPreviewAllowed, type PricingCampaign } from "@/lib/pricing/promotions"
import { Countdown } from "@/components/marketing/Countdown"

const STORAGE_KEY = "renderspace_promo_banner_hidden"
const MARKETING_PATHS = ["/", "/gallery", "/pricing", "/faq", "/contractor-demo", "/mockup-method", "/academy"]

function endLabel(iso: string): string {
  // The campaign ends at midnight Central; name the last day and 11:59pm so it reads naturally.
  const last = new Date(Date.parse(iso) - 60_000)
  const day = last.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" })
  const time = last.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).toLowerCase().replace(" ", "")
  return `${day}, ${time} CT`
}

/** Hook: the Intro Plan campaign that may be advertised on this page right now, or null. */
export function useIntroCampaign(): PricingCampaign | null {
  // Reads the address in the browser after mount (no useSearchParams), so static
  // pages like /pricing can still be prerendered.
  const [campaign, setCampaign] = useState<PricingCampaign | null>(null)
  useEffect(() => {
    setCampaign(introCampaignToShow(new Date(), promoPreviewAllowed(window.location.search)))
  }, [])
  return campaign
}

/**
 * Site-wide strip for a real, dated Intro Plan campaign (Black Friday 2026: first week
 * $10, ends Nov 30 11:59pm CT). Shows only on marketing pages and the demo Studio,
 * only while the campaign is switched on and inside its dates, with a live countdown
 * to that real end. Nothing renders when no campaign is live.
 */
export function PromoBanner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const campaign = useIntroCampaign()
  const [hidden, setHidden] = useState(true)
  const [ended, setEnded] = useState(false)
  const onEnd = useCallback(() => setEnded(true), [])

  useEffect(() => {
    if (!campaign) return
    let dismissed = false
    try {
      dismissed = sessionStorage.getItem(`${STORAGE_KEY}:${campaign.id}`) === "1"
    } catch {
      /* storage blocked */
    }
    const isMarketing = pathname != null && (MARKETING_PATHS.includes(pathname) || pathname.startsWith("/gallery/") || pathname.startsWith("/blog"))
    const isDemo = pathname?.startsWith("/studio") && searchParams?.get("demo") === "true"
    const loginOpen = searchParams?.get("login") != null
    setHidden(dismissed || loginOpen || !(isMarketing || isDemo))
  }, [campaign, pathname, searchParams])

  if (!campaign || hidden || ended) return null

  const firstCharge = moneyFromCents(campaignFirstChargeCents(campaign, CATALOG.intro.amountCents))
  const href = `/onboarding?plan=intro&step=3&promotion=${encodeURIComponent(campaign.id)}`

  return (
    <div role="region" aria-label="Black Friday offer" className="relative z-40 border-b border-orange-500/40 bg-gradient-to-r from-orange-600 to-violet-800 text-white">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-10 py-2 text-center text-sm">
        <span className="font-semibold">Black Friday: your first week of the {CATALOG.intro.name} for {firstCharge}</span>
        <span className="text-white/85">
          Then {moneyFromCents(CATALOG.intro.amountCents)}/week. Ends {endLabel(campaign.endsAt)} ·{" "}
          <Countdown endsAt={campaign.endsAt} onEnd={onEnd} className="font-mono tabular-nums" />
        </span>
        <Link href={href} className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-violet-900 hover:bg-white/90">
          Claim the {firstCharge} week
        </Link>
      </div>
      <button
        type="button"
        aria-label="Dismiss offer"
        onClick={() => {
          setHidden(true)
          try {
            sessionStorage.setItem(`${STORAGE_KEY}:${campaign.id}`, "1")
          } catch {
            /* ignore */
          }
        }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-white/80 hover:text-white"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
