"use client"

import { useEffect } from "react"
import {
  shouldFireHumanPolishSuccessAnalytics,
  trackHumanPolishEvent,
} from "@/components/human-polish/analytics"
import type {
  HumanPolishPackage,
  HumanPolishPromotionType,
  HumanPolishServiceFamily,
} from "@/lib/human-polish/types"

type Props = {
  /** Used only as a local sessionStorage dedupe key — never sent to GA. */
  sessionId: string
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  promotionType: HumanPolishPromotionType
}

export function HumanPolishSuccessAnalytics(props: Props) {
  useEffect(() => {
    if (!shouldFireHumanPolishSuccessAnalytics(props.sessionId)) return

    trackHumanPolishEvent("completed_checkout", {
      family: props.family,
      package: props.pkg,
      promotionType: props.promotionType,
    })

    if (props.family === "ai-render-pack" && props.promotionType === "first_purchase_25") {
      trackHumanPolishEvent("first_purchase_promo_applied", {
        family: "ai-render-pack",
        package: props.pkg,
        promotionType: "first_purchase_25",
      })
    }

    if (props.family === "ai-render-pack" && props.promotionType === "subscriber_15") {
      trackHumanPolishEvent("subscriber_discount_applied", {
        family: "ai-render-pack",
        package: props.pkg,
        promotionType: "subscriber_15",
      })
    }
  }, [props.sessionId, props.family, props.pkg, props.promotionType])

  return null
}
