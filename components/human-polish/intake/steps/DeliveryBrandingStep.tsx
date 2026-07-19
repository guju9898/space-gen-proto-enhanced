"use client"

import { Info } from "lucide-react"
import {
  AI_RENDER_PACK_RUSH_FEE_CENTS,
  AI_RENDER_PACK_RUSH_TARGETS,
} from "@/lib/human-polish/config"
import { formatUsd } from "@/components/human-polish/marketing/marketingConfig"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { StepComponentProps } from "../intakeTypes"
import { CheckboxRow, TextAreaField, TextField } from "../fields"
import { trackHumanPolishEvent } from "@/components/human-polish/analytics"

export function DeliveryBrandingStep({ form, update, family, pkg }: StepComponentProps) {
  const isAiPack = family === "ai-render-pack"
  const rushTarget =
    isAiPack && (pkg === "25" || pkg === "50") ? AI_RENDER_PACK_RUSH_TARGETS[pkg] : null
  const rushFee = formatUsd(AI_RENDER_PACK_RUSH_FEE_CENTS / 100)

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-white">Delivery</h3>
        {isAiPack && rushTarget ? (
          <CheckboxRow
            id="rushRequested"
            checked={form.rushRequested}
            onChange={(v) => {
              update({ rushRequested: v })
              if (v) trackHumanPolishEvent("requested_rush", { family, package: pkg })
            }}
          >
            Request a rush: <strong>{rushTarget}</strong> for {rushFee} (subject to manual approval).
          </CheckboxRow>
        ) : isAiPack && pkg === "100" ? (
          <p className="text-sm text-muted-foreground">
            For expedited delivery on the 100-pack, contact the team after submitting — rush terms
            are custom for large packs.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Standard delivery target applies. Build-Ready delivery begins after scope approval,
            complete-file acceptance, and payment.
          </p>
        )}

        {form.rushRequested ? (
          <Alert className="border-orange-500/40 bg-orange-500/5 text-orange-100">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Rush delivery is confirmed only after the Renderspace team verifies capacity and file
              usability. The rush fee is not charged until capacity is approved.
            </AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="space-y-3 border-t border-[#343434] pt-5">
        <h3 className="text-sm font-semibold text-white">Branding</h3>
        <CheckboxRow
          id="brandingRequested"
          checked={form.brandingRequested}
          onChange={(v) => update({ brandingRequested: v })}
        >
          Add my company branding to the delivered PDF.
        </CheckboxRow>

        {form.brandingRequested ? (
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="projectTitle"
              label="PDF / project title"
              value={form.projectTitle}
              onChange={(v) => update({ projectTitle: v })}
              placeholder="Title shown on the deliverable"
            />
            <TextField
              id="brandPhone"
              label="Company phone (for PDF)"
              type="tel"
              inputMode="tel"
              value={form.brandPhone}
              onChange={(v) => update({ brandPhone: v })}
            />
            <TextField
              id="brandWebsite"
              label="Website"
              type="url"
              inputMode="url"
              value={form.brandWebsite}
              onChange={(v) => update({ brandWebsite: v })}
              placeholder="https://"
            />
            <TextAreaField
              id="brandNotes"
              label="Brand notes"
              rows={2}
              value={form.brandNotes}
              onChange={(v) => update({ brandNotes: v })}
              hint="Upload your logo in the Files step (category: Company logo)."
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
