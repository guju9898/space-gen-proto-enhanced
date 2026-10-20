"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function RequestPayoutButton() {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setPending(true)
        const response = await fetch("/api/affiliates/payout", { method: "POST" })
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        setPending(false)
        setMessage(response.ok ? "Payout requested for admin review." : body?.error || "Could not request a payout.")
        if (response.ok) router.refresh()
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center rounded-md border border-white/30 px-4 text-sm text-white disabled:opacity-60"
      >
        Request payout
      </button>
      {message ? <p className="mt-2 text-sm text-muted-foreground">{message}</p> : null}
    </form>
  )
}
