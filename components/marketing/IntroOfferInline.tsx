"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import { campaignFirstChargeCents } from "@/lib/pricing/promotions"
import { useIntroCampaign } from "@/components/marketing/PromoBanner"
import { Countdown } from "@/components/marketing/Countdown"

/** One line about the live Intro Plan campaign (with countdown), or nothing. */
export function IntroOfferLine({ className }: { className?: string }) {
  const campaign = useIntroCampaign()
  if (!campaign) return null
  return (
    <p className={className}>
      Black Friday: first week {moneyFromCents(campaignFirstChargeCents(campaign, CATALOG.intro.amountCents))}, then{" "}
      {moneyFromCents(CATALOG.intro.amountCents)}/week · ends in <Countdown endsAt={campaign.endsAt} className="font-mono tabular-nums" />
    </p>
  )
}

/** Intro Plan link that carries the live campaign to checkout, so the coupon applies. */
export function IntroPlanLink({ className, children, base = "/onboarding?plan=intro&step=3" }: { className?: string; children: ReactNode; base?: string }) {
  const campaign = useIntroCampaign()
  const href = campaign ? `${base}&promotion=${encodeURIComponent(campaign.id)}` : base
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}
