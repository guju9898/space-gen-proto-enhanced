"use client"

import Link from "next/link"
import type { ComponentProps, ReactNode } from "react"
import { advertisedIntroCampaign } from "@/lib/pricing/promotions"

type LinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string
  children: ReactNode
}

/** Appends `&promotion=<id>` while an Intro campaign is advertised. */
export function withIntroPromotion(href: string, now = new Date()): string {
  const campaign = advertisedIntroCampaign(now)
  if (!campaign) return href
  const url = new URL(href, "https://www.renderspace.ai")
  url.searchParams.set("promotion", campaign.id)
  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * Link to Intro Plan checkout. While Black Friday (or another Intro campaign) is
 * advertised, adds `&promotion=…` so checkout can attach the coupon.
 */
export function IntroPlanLink({ href = "/onboarding?plan=intro&step=3", children, ...rest }: LinkProps) {
  return (
    <Link href={withIntroPromotion(href)} {...rest}>
      {children}
    </Link>
  )
}
