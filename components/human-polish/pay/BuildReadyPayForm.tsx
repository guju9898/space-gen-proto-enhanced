"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatAmountFromCents } from "@/lib/human-polish/email"

type Props = {
  requestId: string
  paymentToken: string
  packageLabel: string
  amountCents: number
  currency: string
  deliveryTarget: string | null
}

export function BuildReadyPayForm(props: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onPay() {
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch("/api/human-polish/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: props.requestId,
            paymentToken: props.paymentToken,
          }),
        })
        const data = (await res.json().catch(() => null)) as
          | { url?: string; error?: string }
          | null
        if (!res.ok || !data?.url) {
          setError(data?.error || "Unable to start secure checkout.")
          return
        }
        window.location.assign(data.url)
      } catch {
        setError("Network error starting checkout. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-6">
      <dl className="space-y-3 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Approved package</dt>
          <dd className="font-medium text-right">{props.packageLabel}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Approved amount</dt>
          <dd className="font-medium text-right">
            {formatAmountFromCents(props.amountCents, props.currency)}
            <span className="block text-xs font-normal text-muted-foreground">
              Before tax
            </span>
          </dd>
        </div>
        {props.deliveryTarget ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Delivery target</dt>
            <dd className="font-medium text-right">{props.deliveryTarget}</dd>
          </div>
        ) : null}
      </dl>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Build-Ready packages support visualization, client presentation, and HOA/design-review
        materials. They do not include architectural, engineering, sealed, permit, or
        construction documents, and do not guarantee HOA approval.
      </p>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Checkout unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <Button type="button" className="w-full" disabled={pending} onClick={onPay}>
        {pending ? "Starting secure checkout…" : "Continue to secure checkout"}
      </Button>
    </div>
  )
}
