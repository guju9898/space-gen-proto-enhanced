"use client"

import { useEffect } from "react"
import { trackAffiliateEvent } from "@/components/conversion/group-6/analytics"

export function AffiliateDashboardView() {
  useEffect(() => {
    trackAffiliateEvent("affiliate_dashboard_viewed", "viewed")
  }, [])
  return null
}
