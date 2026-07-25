"use client"

/**
 * Human Polish™ intake — call / WhatsApp escape hatch (spec §3.3, §4.1).
 * Reuses the assisted-sales contacts from the read-only marketing config.
 */

import { MessageCircle, Phone } from "lucide-react"
import { ASSISTED_SALES } from "@/components/human-polish/marketing/marketingConfig"
import { trackHumanPolishEvent } from "@/components/human-polish/analytics"

export function AssistedSalesBar() {
  return (
    <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-4">
      <p className="text-sm text-muted-foreground">
        Prefer to talk it through? Request a quick call or message us on WhatsApp.
      </p>
      <div className="mt-3 flex flex-wrap gap-3">
        <a
          href={ASSISTED_SALES.callMailto}
          onClick={() => trackHumanPolishEvent("requested_call", { source: "intake" })}
          className="inline-flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <Phone className="h-4 w-4" />
          Request a call
        </a>
        <a
          href={ASSISTED_SALES.whatsappMailto}
          onClick={() => trackHumanPolishEvent("clicked_whatsapp", { source: "intake" })}
          className="inline-flex items-center gap-2 rounded-md border border-white/30 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
        >
          <MessageCircle className="h-4 w-4" />
          Message on WhatsApp
        </a>
      </div>
    </div>
  )
}
