"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { adminSendRightsPermissionRequest } from "@/lib/human-polish/admin-actions"
import {
  RIGHTS_PERMISSION_STATUS_LABELS,
  isHumanPolishRightsPermissionStatus,
} from "@/lib/human-polish/rights-guards"
import { formatAdminDate } from "@/lib/human-polish/admin-utils"

type Props = {
  requestId: string
  expectedUpdatedAt: string
  paymentStatus: string
  status: string
  rightsPermissionStatus: string
  rightsRequestedAt: string | null
  rightsRespondedAt: string | null
  rightsPermissionExpiresAt: string | null
}

export function AdminRightsPanel(props: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(
    null
  )

  const paid = props.paymentStatus === "paid"
  const completed = props.status === "completed"
  const status = isHumanPolishRightsPermissionStatus(props.rightsPermissionStatus)
    ? props.rightsPermissionStatus
    : "not_requested"

  const expiresMs = props.rightsPermissionExpiresAt
    ? Date.parse(props.rightsPermissionExpiresAt)
    : NaN
  const tokenActive =
    status === "requested" && Number.isFinite(expiresMs) && expiresMs > Date.now()
  const canIssue =
    paid &&
    completed &&
    (status === "not_requested" || (status === "requested" && !tokenActive))

  function onRequest() {
    setFeedback(null)
    startTransition(async () => {
      const result = await adminSendRightsPermissionRequest({
        requestId: props.requestId,
        expectedUpdatedAt: props.expectedUpdatedAt,
      })
      if (!result.ok) {
        setFeedback({ kind: "error", text: result.error || "Unable to send request." })
        return
      }
      if (result.warning) {
        setFeedback({ kind: "warn", text: result.warning })
      } else {
        setFeedback({ kind: "ok", text: "Portfolio permission request sent." })
      }
      router.refresh()
    })
  }

  if (!paid || !completed) {
    return null
  }

  return (
    <section className="space-y-4 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4">
      <div>
        <h3 className="text-lg font-semibold">Portfolio permission</h3>
        <p className="text-sm text-muted-foreground">
          Explicit customer Allow/Decline only. Narrow visualization portfolio use —
          not name, company, address, or testimonial attribution.
        </p>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Status</dt>
          <dd className="mt-1">{RIGHTS_PERMISSION_STATUS_LABELS[status]}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Requested at</dt>
          <dd className="mt-1">{formatAdminDate(props.rightsRequestedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">Responded at</dt>
          <dd className="mt-1">{formatAdminDate(props.rightsRespondedAt)}</dd>
        </div>
      </dl>

      {feedback ? (
        <Alert variant={feedback.kind === "error" ? "destructive" : "default"}>
          <AlertTitle>
            {feedback.kind === "ok" ? "Success" : feedback.kind === "warn" ? "Warning" : "Error"}
          </AlertTitle>
          <AlertDescription>{feedback.text}</AlertDescription>
        </Alert>
      ) : null}

      {status === "granted" || status === "declined" ? (
        <p className="text-sm text-muted-foreground">Final decision recorded — no further action.</p>
      ) : null}

      {status === "requested" && tokenActive ? (
        <p className="text-sm text-muted-foreground">
          Permission request is active. Reissue is available after the link expires.
        </p>
      ) : null}

      {canIssue ? (
        <Button type="button" disabled={pending} onClick={onRequest}>
          {pending
            ? "Sending…"
            : status === "requested"
              ? "Reissue permission request"
              : "Request portfolio permission"}
        </Button>
      ) : null}
    </section>
  )
}
