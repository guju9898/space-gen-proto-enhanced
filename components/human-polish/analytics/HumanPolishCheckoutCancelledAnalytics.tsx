"use client"

import { useEffect } from "react"
import { trackHumanPolishEvent } from "@/components/human-polish/analytics"
import {
  isHumanPolishPackage,
  isHumanPolishServiceFamily,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

/**
 * Fires checkout_cancelled once when safe query flags are present, then strips
 * only those analytics flags from the URL (preserves payment token if present).
 */
export function HumanPolishCheckoutCancelledAnalytics() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    if (url.searchParams.get("hp_checkout") !== "cancelled") return

    const familyRaw = url.searchParams.get("family")
    const packageRaw = url.searchParams.get("package")
    if (
      isHumanPolishServiceFamily(familyRaw) &&
      isHumanPolishPackage(packageRaw)
    ) {
      trackHumanPolishEvent("checkout_cancelled", {
        family: familyRaw as HumanPolishServiceFamily,
        package: packageRaw as HumanPolishPackage,
      })
    }

    url.searchParams.delete("hp_checkout")
    url.searchParams.delete("family")
    url.searchParams.delete("package")
    const next = `${url.pathname}${url.search}${url.hash}`
    window.history.replaceState({}, "", next)
  }, [])

  return null
}
