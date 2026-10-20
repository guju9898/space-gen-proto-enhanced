"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CAPACITY_NOTE, type PremiumAvailability, type PremiumService } from "@/lib/premium/availability"
import { trackPremiumEvent } from "@/components/conversion/group-5/analytics"

const HREFS: Record<PremiumService, string> = {
  premium_onboarding: "/book-demo?source=contractor-demo",
  mailer: "/book-demo?source=mailer",
  human_polish: "/human-polish/intake",
}

export function PremiumOnboardingAvailability({
  service,
  href,
  title = "Premium Onboarding Availability",
}: {
  service: PremiumService
  href?: string
  title?: string
}) {
  const [data, setData] = useState<PremiumAvailability | null>(null)
  const seen = useRef(false)
  const destination = href ?? HREFS[service]

  useEffect(() => {
    let cancelled = false
    fetch(`/api/premium/availability?service=${service}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((body: PremiumAvailability | null) => {
        if (!cancelled && body && body.service === service) setData(body)
      })
      .catch(() => {
        if (!cancelled) {
          setData({
            service,
            status: "unknown",
            slots: null,
            nextDate: null,
            message: service === "human_polish"
              ? "Request the next available production date."
              : "Request the next available onboarding date.",
            showCapacityNote: false,
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [service])

  useEffect(() => {
    if (!data || seen.current) return
    seen.current = true
    trackPremiumEvent("premium_availability_viewed", { service, status: data.status })
  }, [data, service])

  if (!data) return null

  return (
    <section className="container mx-auto px-4 py-8" aria-labelledby={`availability-${service}`}>
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/40 p-6">
        <h2 id={`availability-${service}`} className="text-xl font-semibold text-white">
          {title}
        </h2>
        {data.showCapacityNote && <p className="mt-3 text-sm text-muted-foreground">{CAPACITY_NOTE}</p>}
        <p className="mt-3 text-sm text-muted-foreground">{data.message}</p>
        <Link
          href={destination}
          onClick={() => {
            trackPremiumEvent("premium_opening_requested", { service, status: data.status })
            if (service !== "premium_onboarding") {
              trackPremiumEvent("premium_service_inquiry", { service, status: data.status })
            }
          }}
          className="mt-4 inline-flex h-10 items-center rounded-md border border-white/30 px-4 text-sm font-medium text-white hover:bg-white/10"
        >
          Request an opening
        </Link>
      </div>
    </section>
  )
}
