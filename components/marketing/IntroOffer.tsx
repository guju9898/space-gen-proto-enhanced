"use client"

import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { advertisedIntroCampaign, canUsePromoPreview, previewIntroCampaign, type PricingCampaign } from "@/lib/pricing/promotions"
import { withIntroPromotion } from "@/components/marketing/IntroPlanLink"

export type IntroOffer = {
  campaign: PricingCampaign
  /** First charge after the discount, in cents. */
  firstCents: number
  /** Short public name for the offer, e.g. "Black Friday". */
  name: string
}

const OFFER_NAMES: Record<string, string> = { "black-friday-2026": "Black Friday" }

/** The live Intro Plan offer (same gate as checkout advertising), or null. */
export function getIntroOffer(now = new Date()): IntroOffer | null {
  // Preview builds only: ?promo_preview=1 shows the offer before it's switched on (same rule as the banner).
  const preview =
    typeof window !== "undefined" && canUsePromoPreview() && new URLSearchParams(window.location.search).get("promo_preview") === "1"
  const campaign = preview ? previewIntroCampaign() : advertisedIntroCampaign(now)
  if (!campaign) return null
  const firstCents =
    campaign.amountOffCents != null
      ? Math.max(0, CATALOG.intro.amountCents - campaign.amountOffCents)
      : campaign.percentOff != null
        ? Math.max(0, Math.round(CATALOG.intro.amountCents * (1 - campaign.percentOff / 100)))
        : CATALOG.intro.amountCents
  return { campaign, firstCents, name: OFFER_NAMES[campaign.id] ?? "Limited-time offer" }
}

/** "$10 first week, then $19.99/week" while an offer is live; "$19.99/week" otherwise. */
export function IntroPriceText({ className }: { className?: string }) {
  const offer = getIntroOffer()
  const weekly = moneyFromCents(CATALOG.intro.amountCents)
  if (!offer) return <span className={className}>{weekly}/week</span>
  return (
    <span className={className}>
      {moneyFromCents(offer.firstCents)} first week, then {weekly}/week
    </span>
  )
}

/** Text that changes while an offer is live, e.g. button labels. */
export function IntroOfferSwitch({ live, otherwise }: { live: (offer: IntroOffer) => ReactNode; otherwise: ReactNode }) {
  const offer = getIntroOffer()
  return <>{offer ? live(offer) : otherwise}</>
}

/**
 * Header button. For the Intro Plan CTA it names the live offer and carries it to
 * checkout; any other CTA renders unchanged.
 */
export function HeaderCtaLink({
  href,
  label,
  ...rest
}: Omit<ComponentProps<typeof Link>, "href" | "children"> & { href: string; label: string }) {
  const offer = getIntroOffer()
  const isIntro = /plan=(starter|intro)\b/.test(href)
  if (!offer || !isIntro) {
    return (
      <Link href={href} {...rest}>
        {label}
      </Link>
    )
  }
  return (
    <Link href={withIntroPromotion(href)} {...rest}>
      {offer.name}: {moneyFromCents(offer.firstCents)} first week
    </Link>
  )
}

/** Homepage Intro card headline (server pages can't pass render functions to client components). */
export function IntroTripwireLine() {
  const offer = getIntroOffer()
  const weekly = moneyFromCents(CATALOG.intro.amountCents)
  if (!offer) {
    return (
      <>
        New here? Try Renderspace on a real job for <span className="font-semibold text-white">{weekly}</span>
      </>
    )
  }
  return (
    <>
      {offer.name}: try Renderspace on a real job for{" "}
      <span className="font-semibold text-white">{moneyFromCents(offer.firstCents)}</span> your first week, then {weekly}/week
    </>
  )
}

/** Homepage Intro card button label. */
export function IntroTripwireButtonLabel() {
  const offer = getIntroOffer()
  if (offer) return <>Start your {moneyFromCents(offer.firstCents)} first week</>
  return (
    <>
      Try {CATALOG.intro.credits} Credits for {moneyFromCents(CATALOG.intro.amountCents)}
    </>
  )
}
