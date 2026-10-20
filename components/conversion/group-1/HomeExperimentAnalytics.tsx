"use client"

import { useEffect, type ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { trackHomepageEvent } from "./analytics"
import {
  GUEST_STUDIO_HREF,
  PAID_PLAN_HREF,
  type HomeVariant,
} from "./experiment"

const primaryClass =
  "inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
const secondaryClass =
  "inline-flex items-center border border-white/30 hover:bg-white/10 transition-all text-white px-6 py-3 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"

export function HomeExperimentBeacon({ variant }: { variant: HomeVariant }) {
  useEffect(() => {
    trackHomepageEvent("homepage_viewed", { variant })
  }, [variant])
  return null
}

export function HomeCtaLink({
  href,
  variant,
  destination,
  className,
  children,
}: {
  href: string
  variant: HomeVariant
  destination: "guest_studio" | "paid_plan" | "gallery"
  className: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        trackHomepageEvent("hero_cta_clicked", { variant, destination })
        if (destination === "guest_studio") {
          trackHomepageEvent("guest_studio_started", { variant })
        }
      }}
    >
      {children}
    </Link>
  )
}

export function HomeHeroActions({
  variant,
  paidLabel,
}: {
  variant: HomeVariant
  paidLabel: string
}) {
  if (variant === "b") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <HomeCtaLink href={GUEST_STUDIO_HREF} variant={variant} destination="guest_studio" className={primaryClass}>
            Visualize My Next Project <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </HomeCtaLink>
          <HomeCtaLink href={PAID_PLAN_HREF} variant={variant} destination="paid_plan" className={secondaryClass}>
            {paidLabel}
          </HomeCtaLink>
        </div>
        <p className="text-sm text-muted-foreground">Try up to 5 renders. No credit card required.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
      <HomeCtaLink href={PAID_PLAN_HREF} variant={variant} destination="paid_plan" className={primaryClass}>
        {paidLabel} <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </HomeCtaLink>
      <HomeCtaLink href="/gallery" variant={variant} destination="gallery" className={secondaryClass}>
        See Real Examples
      </HomeCtaLink>
    </div>
  )
}

export function HomeClosingCta({
  variant,
  paidDetail,
}: {
  variant: HomeVariant
  paidDetail: string
}) {
  if (variant === "b") {
    return (
      <>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">See the finished job before you quote it</h2>
        <p className="text-muted-foreground mb-6">
          Open the guest Studio with a job-site photo. {paidDetail} whenever you want the full credit pack.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <HomeCtaLink href={GUEST_STUDIO_HREF} variant={variant} destination="guest_studio" className={primaryClass}>
            Visualize My Next Project <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </HomeCtaLink>
          <HomeCtaLink href={PAID_PLAN_HREF} variant={variant} destination="paid_plan" className={secondaryClass}>
            Start the First Job Test
          </HomeCtaLink>
        </div>
      </>
    )
  }

  return (
    <>
      <h2 className="text-2xl md:text-3xl font-bold mb-4 text-white">Try it on your next estimate</h2>
      <p className="text-muted-foreground mb-6">
        {paidDetail}. Take a photo at your next walkthrough and show the client what their project could look like
        before you leave.
      </p>
      <HomeCtaLink href={PAID_PLAN_HREF} variant={variant} destination="paid_plan" className={primaryClass}>
        Start the First Job Test <ChevronRight className="w-4 h-4" aria-hidden="true" />
      </HomeCtaLink>
    </>
  )
}
