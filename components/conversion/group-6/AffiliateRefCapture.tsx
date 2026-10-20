"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { trackAffiliateEvent } from "@/components/conversion/group-6/analytics"

/** Records a first-party referral when a page is opened with ?ref=CODE. */
export function AffiliateRefCapture() {
  const params = useSearchParams()
  const code = params?.get("ref") ?? null

  useEffect(() => {
    if (!code) return
    const key = `rs_aff_sent:${code}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
    const path = window.location.pathname
    void fetch("/api/affiliates/click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code, path }),
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => null)) as { captured?: boolean } | null
        trackAffiliateEvent("affiliate_referral_captured", body?.captured ? "captured" : "ignored")
      })
      .catch(() => {
        trackAffiliateEvent("affiliate_referral_captured", "ignored")
      })
  }, [code])

  return null
}
