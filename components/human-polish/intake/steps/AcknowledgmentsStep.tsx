"use client"

import { ShieldCheck } from "lucide-react"
import { AI_RENDER_PACK_EXPIRATION_DAYS } from "@/lib/human-polish/config"
import { HUMAN_POLISH_PACKAGE_LABELS } from "@/lib/human-polish/types"
import { REQUIRED_DISCLAIMER } from "@/components/human-polish/marketing/marketingConfig"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { StepComponentProps } from "../intakeTypes"
import { CheckboxRow } from "../fields"

export function AcknowledgmentsStep({ form, update, errors, family, pkg, session }: StepComponentProps) {
  const isAiPack = family === "ai-render-pack"
  const firstBatch = session?.firstBatchSize ?? null

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <ShieldCheck className="h-4 w-4 text-orange-300" />
          What&apos;s included
        </h3>
        {isAiPack ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Your package includes{" "}
            <strong className="text-white">{HUMAN_POLISH_PACKAGE_LABELS[pkg]}</strong>, delivered as
            high-resolution PNG files and an organized PDF that can carry your company branding.
            {firstBatch
              ? ` Your first batch contains ${firstBatch} concepts so we can confirm the approved brief was followed before completing the remainder.`
              : ""}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            <strong className="text-white">{HUMAN_POLISH_PACKAGE_LABELS[pkg]}</strong> is a
            human-produced presentation package. All Build-Ready requests are reviewed by our team
            before payment and production. We produce plans and visuals based on the approved concept
            and the project information you provide.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <CheckboxRow
          id="ackPermission"
          checked={form.ackPermission}
          onChange={(v) => update({ ackPermission: v })}
          error={errors.ackPermission}
        >
          I have permission to submit these property photos and project documents.
        </CheckboxRow>

        <CheckboxRow
          id="ackConceptual"
          checked={form.ackConceptual}
          onChange={(v) => update({ ackConceptual: v })}
          error={errors.ackConceptual}
        >
          I understand these are conceptual and presentation renderings — not construction,
          architectural, engineering, structural, or permit documents.
        </CheckboxRow>

        <CheckboxRow
          id="ackDeliveryClock"
          checked={form.ackDeliveryClock}
          onChange={(v) => update({ ackDeliveryClock: v })}
          error={errors.ackDeliveryClock}
        >
          I understand the delivery clock begins only after Renderspace confirms my files and
          instructions are complete and usable.
        </CheckboxRow>

        {isAiPack ? (
          <>
            <CheckboxRow
              id="ackGuaranteeScope"
              checked={form.ackGuaranteeScope}
              onChange={(v) => update({ ackGuaranteeScope: v })}
              error={errors.ackGuaranteeScope}
            >
              I understand a new property, new design direction, or new client request is not a
              correction under the First-Batch Brief-Match Guarantee.
            </CheckboxRow>

            <CheckboxRow
              id="ackExpiration"
              checked={form.ackExpiration}
              onChange={(v) => update({ ackExpiration: v })}
              error={errors.ackExpiration}
            >
              I understand this pack must be used within {AI_RENDER_PACK_EXPIRATION_DAYS} days.
            </CheckboxRow>
          </>
        ) : (
          <CheckboxRow
            id="ackScopeReview"
            checked={form.ackScopeReview}
            onChange={(v) => update({ ackScopeReview: v })}
            error={errors.ackScopeReview}
          >
            I understand this request is submitted for human scope review, and pricing/production are
            confirmed after that review — a new direction or major scope change may require a new
            package or custom fee.
          </CheckboxRow>
        )}

        <CheckboxRow
          id="ackTerms"
          checked={form.ackTerms}
          onChange={(v) => update({ ackTerms: v })}
          error={errors.ackTerms}
        >
          I agree to the applicable terms and privacy policy.
        </CheckboxRow>
      </div>

      <div className="border-t border-[#343434] pt-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Optional
        </p>
        <CheckboxRow
          id="marketingPermission"
          checked={form.marketingPermission}
          onChange={(v) => update({ marketingPermission: v })}
        >
          Renderspace may contact me later to request permission to feature this work.
        </CheckboxRow>
      </div>

      <Alert className="border-[#343434] bg-[#10141f]/60 text-muted-foreground">
        <AlertDescription className="text-xs">{REQUIRED_DISCLAIMER}</AlertDescription>
      </Alert>
    </div>
  )
}
