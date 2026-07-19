"use client"

import { AI_RENDER_PACK_EXPIRATION_DAYS } from "@/lib/human-polish/config"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  type HumanPolishPackage,
  type HumanPolishServiceFamily,
} from "@/lib/human-polish/types"
import { formatUsd } from "@/components/human-polish/marketing/marketingConfig"
import type { DraftSession, IntakeFormData } from "../intakeTypes"
import { PROJECT_TYPE_LABELS } from "../intakeConfig"

interface OrderSummaryStepProps {
  form: IntakeFormData
  family: HumanPolishServiceFamily
  pkg: HumanPolishPackage
  session: DraftSession | null
  uploadedCount: number
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium text-white">{value}</span>
    </div>
  )
}

export function OrderSummaryStep({
  form,
  family,
  pkg,
  session,
  uploadedCount,
}: OrderSummaryStepProps) {
  const isAiPack = family === "ai-render-pack"
  const isCustom = pkg === "custom"
  const priceCents = session?.standardAmountCents ?? null
  const priceLabel =
    priceCents != null ? formatUsd(priceCents / 100) : "Quoted after scope review"

  const scopeParts = [
    form.projectType ? PROJECT_TYPE_LABELS[form.projectType] : null,
    form.projectCity ? `${form.projectCity}${form.projectState ? `, ${form.projectState}` : ""}` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-5">
        <h3 className="text-base font-semibold text-white">
          {HUMAN_POLISH_PACKAGE_LABELS[pkg]}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isAiPack ? "AI Render Pack" : "Build-Ready Package"}
        </p>

        <div className="mt-3 divide-y divide-[#343434]/60">
          {isAiPack ? (
            <Row label="Concepts" value={HUMAN_POLISH_PACKAGE_LABELS[pkg]} />
          ) : null}
          {session?.firstBatchSize ? (
            <Row label="First batch" value={`${session.firstBatchSize} concepts`} />
          ) : null}
          {scopeParts.length ? <Row label="Project / property" value={scopeParts.join(" · ")} /> : null}
          {session?.deliveryTarget ? (
            <Row label="Standard turnaround" value={session.deliveryTarget} />
          ) : null}
          <Row label="Delivery type" value={form.rushRequested ? "Rush requested (needs approval)" : "Standard"} />
          <Row label="Branding" value={form.brandingRequested ? "Company-branded PDF" : "No branding"} />
          <Row label="Files uploaded" value={`${uploadedCount}`} />
          <Row label="Standard price" value={priceLabel} />
        </div>
      </div>

      <div className="rounded-xl border border-[#343434] bg-[#10141f]/50 p-5 text-sm text-muted-foreground space-y-2">
        <p>
          <span className="font-medium text-white">Best eligible offer & discounts:</span> applied at
          secure checkout by our servers (first-purchase or subscriber pricing — discounts never
          stack). Prices shown are before tax.
        </p>
        <p>
          <span className="font-medium text-white">Tax:</span> calculated separately by Stripe Tax at
          checkout and not included above.
        </p>
        {isAiPack ? (
          <>
            <p>
              <span className="font-medium text-white">First-Batch Brief-Match Guarantee:</span> if
              the first batch materially fails to follow your approved brief, notify us within 24
              hours and we correct the direction once at no additional charge before completing the
              pack.
            </p>
            <p>
              <span className="font-medium text-white">
                {AI_RENDER_PACK_EXPIRATION_DAYS}-day use period:
              </span>{" "}
              packs must be used within {AI_RENDER_PACK_EXPIRATION_DAYS} days of purchase.
            </p>
          </>
        ) : null}
        {isCustom ? (
          <p>
            <span className="font-medium text-white">Custom project:</span> pricing is manually quoted
            after our team reviews your files and scope.
          </p>
        ) : null}
        <p>
          <span className="font-medium text-white">Delivery clock:</span> begins only after Renderspace
          confirms your files and instructions are complete and usable.
        </p>
        <p>
          <span className="font-medium text-white">Scope:</span> visualization, client presentation,
          and HOA/design-review support only — no architectural, structural, civil, or engineering
          services, seals, permit drawings, or construction documents.
        </p>
      </div>
    </div>
  )
}
