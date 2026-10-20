"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LIFECYCLE_LIMITS } from "@/lib/offers/config"
import { CATALOG, moneyFromCents } from "@/lib/pricing/catalog"
import type { LifecycleOffer as Offer } from "@/lib/offers/eligibility"
import { trackLifecycleEvent } from "@/components/conversion/group-4/analytics"

const GUEST_KEY = "rs_lifecycle_guest_renders"

function guestOffer(completedRenders: number): Offer | null {
  if (completedRenders < LIFECYCLE_LIMITS.generationRenders) return null
  if (typeof window !== "undefined" && sessionStorage.getItem("rs_lifecycle_guest_dismissed") === "1") return null
  return {
    id: "generation-subscription",
    trigger: "generation",
    headline: "Your next project is ready to visualize. Get more room to create.",
    body: `${CATALOG.professional.name} is ${moneyFromCents(CATALOG.professional.amountCents)} per month and includes ${CATALOG.professional.credits.toLocaleString("en-US")} credits. No limited-time discount is active.`,
    href: "/onboarding?plan=professional&step=3",
    cta: `See ${CATALOG.professional.name}`,
    promotionId: null,
    plan: "professional",
  }
}

export function LifecycleOffer({
  busy,
  completedRenders = 0,
}: {
  busy: boolean
  completedRenders?: number
}) {
  const [offer, setOffer] = useState<Offer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/offers", { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { offer?: Offer | null; authenticated?: boolean } | null) => {
        if (cancelled) return
        if (data?.offer) {
          setOffer(data.offer)
          trackLifecycleEvent("lifecycle_offer_eligible", {
            offer_id: data.offer.id,
            trigger: data.offer.trigger,
            plan: data.offer.plan ?? undefined,
            status: "eligible",
          })
        } else if (data && data.authenticated === false) {
          setOffer(guestOffer(completedRenders))
        } else {
          setOffer(null)
        }
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setOffer(null)
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [completedRenders])

  useEffect(() => {
    if (!ready || !offer || busy) return
    const seenKey = `rs_lifecycle_seen_${offer.id}`
    if (sessionStorage.getItem(seenKey) === "1") return
    sessionStorage.setItem(seenKey, "1")
    trackLifecycleEvent("lifecycle_offer_viewed", {
      offer_id: offer.id,
      trigger: offer.trigger,
      plan: offer.plan ?? undefined,
      status: "viewed",
    })
    void fetch("/api/offers/state", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "impression", offerId: offer.id }),
    }).catch(() => undefined)
  }, [ready, offer, busy])

  if (!ready || busy || !offer) return null

  const dismiss = () => {
    trackLifecycleEvent("lifecycle_offer_dismissed", {
      offer_id: offer.id,
      trigger: offer.trigger,
      plan: offer.plan ?? undefined,
      status: "dismissed",
    })
    sessionStorage.setItem("rs_lifecycle_guest_dismissed", "1")
    void fetch("/api/offers/state", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "dismiss", offerId: offer.id }),
    }).catch(() => undefined)
    sessionStorage.setItem(GUEST_KEY, "1")
    setOffer(null)
  }

  return (
    <aside className="mt-4 rounded-lg border border-border bg-card p-4 text-sm" aria-label="Suggested next step">
      <div className="flex items-start justify-between gap-3">
        <p className="font-medium text-foreground">{offer.headline}</p>
        <button type="button" onClick={dismiss} className="h-10 px-2 text-muted-foreground" aria-label="Dismiss suggestion">
          Close
        </button>
      </div>
      <p className="mt-2 text-muted-foreground">{offer.body}</p>
      <Link
        href={offer.href}
        onClick={() => {
          trackLifecycleEvent("lifecycle_offer_clicked", {
            offer_id: offer.id,
            trigger: offer.trigger,
            plan: offer.plan ?? undefined,
            status: "clicked",
          })
          if (offer.href.startsWith("/onboarding")) {
            trackLifecycleEvent("lifecycle_checkout_started", {
              offer_id: offer.id,
              trigger: offer.trigger,
              plan: offer.plan ?? undefined,
              status: "checkout",
            })
          }
        }}
        className="mt-3 inline-flex h-10 items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 text-sm font-medium text-white"
      >
        {offer.cta}
      </Link>
    </aside>
  )
}
