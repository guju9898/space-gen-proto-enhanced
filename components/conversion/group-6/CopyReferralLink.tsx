"use client"

import { useState } from "react"
import { trackAffiliateEvent } from "@/components/conversion/group-6/analytics"

export function CopyReferralLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      className="inline-flex h-10 items-center rounded-md border border-white/30 px-4 text-sm text-white"
      onClick={() => {
        void navigator.clipboard.writeText(link).then(() => {
          setCopied(true)
          trackAffiliateEvent("affiliate_link_copied", "copied")
        })
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  )
}
