"use client"

/**
 * Human Polish™ intake — manual draft recovery (spec §4.1).
 * Recovers a draft within the 15-minute window via requestId + draftToken.
 */

import { useState } from "react"
import { Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TextField } from "./fields"

interface DraftRecoveryPanelProps {
  onRecover: (requestId: string, draftToken: string) => Promise<{ ok: boolean; error?: string }>
}

export function DraftRecoveryPanel({ onRecover }: DraftRecoveryPanelProps) {
  const [requestId, setRequestId] = useState("")
  const [draftToken, setDraftToken] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRecover = async () => {
    if (!requestId.trim() || !draftToken.trim()) {
      setError("Enter both your request ID and draft token.")
      return
    }
    setBusy(true)
    setError(null)
    const result = await onRecover(requestId, draftToken)
    setBusy(false)
    if (!result.ok) setError(result.error ?? "That draft could not be recovered.")
  }

  return (
    <div className="rounded-xl border border-[#343434] bg-[#191f33]/40 p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
        <RotateCcw className="h-4 w-4" />
        Recover a saved draft
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Drafts can be recovered for 15 minutes using the request ID and draft token you were issued.
      </p>
      <div className="mt-4 space-y-4">
        <TextField
          id="recoverRequestId"
          label="Request ID"
          value={requestId}
          onChange={setRequestId}
          placeholder="Request ID"
        />
        <TextField
          id="recoverDraftToken"
          label="Draft token"
          value={draftToken}
          onChange={setDraftToken}
          placeholder="Draft token"
        />
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <Button
          type="button"
          onClick={handleRecover}
          disabled={busy}
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Recover draft
        </Button>
      </div>
    </div>
  )
}
