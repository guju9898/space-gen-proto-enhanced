"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { submitRightsPermissionDecision } from "@/lib/human-polish/rights-actions"

type Props = {
  requestId: string
  token: string
}

export function RightsPermissionForm(props: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<"granted" | "declined" | null>(null)

  function decide(decision: "allow" | "decline") {
    setError(null)
    startTransition(async () => {
      const result = await submitRightsPermissionDecision({
        requestId: props.requestId,
        token: props.token,
        decision,
      })
      if (!result.ok) {
        setError(result.error || "Unable to record your decision.")
        return
      }
      setDone(result.decision || (decision === "allow" ? "granted" : "declined"))
    })
  }

  if (done) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-sm">
        <p className="font-medium text-emerald-100">
          {done === "granted"
            ? "Thank you — portfolio permission recorded as allowed."
            : "Thank you — portfolio permission recorded as declined."}
        </p>
        <p className="mt-2 text-muted-foreground">
          You can close this page. No further action is required.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to save</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={pending}
          onClick={() => decide("allow")}
        >
          Allow portfolio use
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={pending}
          onClick={() => decide("decline")}
        >
          Decline
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Neither option is preselected. Your choice is final for this permission request.
      </p>
    </div>
  )
}
