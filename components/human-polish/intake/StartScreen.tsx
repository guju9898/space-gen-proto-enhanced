"use client"

import { useState } from "react"
import { ArrowRight, Loader2, Lock } from "lucide-react"
import {
  getDeliveryTarget,
  getFirstBatchSize,
  getStandardAmountCents,
} from "@/lib/human-polish/config"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  HUMAN_POLISH_SERVICE_FAMILY_LABELS,
  type AiRenderPackPackage,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { formatUsd } from "@/components/human-polish/marketing/marketingConfig"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AssistedSalesBar } from "./AssistedSalesBar"
import { DraftRecoveryPanel } from "./DraftRecoveryPanel"

interface StartScreenProps {
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  creating: boolean
  error: string | null
  onBegin: () => void
  onRecover: (requestId: string, draftToken: string) => Promise<{ ok: boolean; error?: string }>
}

export function StartScreen({
  family,
  pkg,
  creating,
  error,
  onBegin,
  onRecover,
}: StartScreenProps) {
  const [showRecover, setShowRecover] = useState(false)

  const isAiPack = family === "ai-render-pack"
  const priceCents = getStandardAmountCents(family, pkg)
  const delivery = getDeliveryTarget(family, pkg)
  const firstBatch =
    isAiPack && pkg !== "custom" ? getFirstBatchSize(pkg as AiRenderPackPackage) : null

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-300">
          {HUMAN_POLISH_SERVICE_FAMILY_LABELS[family]}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white md:text-4xl">
          Start your {HUMAN_POLISH_PACKAGE_LABELS[pkg]} request
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          A guided design interview — one question group at a time. We create a private draft before
          any files are uploaded, and you can pick up where you left off for 15 minutes.
        </p>
      </div>

      <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5" />
          Package locked for this request
        </div>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">{HUMAN_POLISH_PACKAGE_LABELS[pkg]}</h2>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {firstBatch ? <li>• First batch: {firstBatch} concepts</li> : null}
              {delivery ? <li>• Delivery target: {delivery}</li> : null}
              <li>• {isAiPack ? "Standard checkout after summary" : "Submitted for scope review"}</li>
            </ul>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {priceCents != null ? formatUsd(priceCents / 100) : "Custom quote"}
            </p>
            <p className="text-xs text-muted-foreground">
              {priceCents != null ? "Standard price before tax" : "Quoted after scope review"}
            </p>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-500/40 bg-red-500/5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          onClick={onBegin}
          disabled={creating}
          className="bg-gradient-to-r from-orange-500 to-violet-700 text-white hover:opacity-90"
          size="lg"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Begin intake
          {!creating ? <ArrowRight className="h-4 w-4" /> : null}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-white"
          onClick={() => setShowRecover((s) => !s)}
        >
          {showRecover ? "Hide recovery" : "Recover a saved draft"}
        </Button>
      </div>

      {showRecover ? <DraftRecoveryPanel onRecover={onRecover} /> : null}

      <AssistedSalesBar />
    </div>
  )
}
