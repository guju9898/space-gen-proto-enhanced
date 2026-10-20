"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { trackAffiliateEvent } from "@/components/conversion/group-6/analytics"

const TYPES = [
  ["landscaping", "Landscaping contractor"],
  ["pool", "Pool or outdoor living"],
  ["educator", "Construction sales educator"],
  ["creator", "Design content creator"],
  ["consultant", "Consultant or industry influencer"],
  ["other", "Other industry partner"],
] as const

export function AffiliateApplyForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        setError(null)
        const form = new FormData(event.currentTarget)
        const response = await fetch("/api/affiliates/apply", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            displayName: form.get("displayName"),
            partnerType: form.get("partnerType"),
            website: form.get("website"),
            note: form.get("note"),
          }),
        })
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setPending(false)
        if (!response.ok) {
          setError(body?.error || "Could not submit the application.")
          return
        }
        trackAffiliateEvent("affiliate_application_submitted", "submitted")
        router.refresh()
      }}
    >
      <label className="block text-sm text-white">
        Name or company
        <input
          name="displayName"
          required
          minLength={2}
          maxLength={80}
          className="mt-1 h-10 w-full rounded-md border border-white/15 bg-transparent px-3"
        />
      </label>
      <label className="block text-sm text-white">
        Partner type
        <select name="partnerType" required className="mt-1 h-10 w-full rounded-md border border-white/15 bg-[#0d1119] px-3">
          {TYPES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-white">
        Website
        <input
          name="website"
          type="url"
          placeholder="https://"
          className="mt-1 h-10 w-full rounded-md border border-white/15 bg-transparent px-3"
        />
      </label>
      <label className="block text-sm text-white">
        How you work with contractors
        <textarea name="note" maxLength={500} rows={4} className="mt-1 w-full rounded-md border border-white/15 bg-transparent px-3 py-2" />
      </label>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Submitting" : "Apply"}
      </button>
    </form>
  )
}
