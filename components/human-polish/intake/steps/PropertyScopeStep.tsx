"use client"

import { Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { StepComponentProps } from "../intakeTypes"
import { CheckboxRow } from "../fields"

export function PropertyScopeStep({ form, update, errors }: StepComponentProps) {
  return (
    <div className="space-y-5">
      <Alert className="border-[#343434] bg-[#191f33]/50 text-muted-foreground">
        <Info className="h-4 w-4" />
        <AlertDescription>
          A standard pack covers <strong className="text-white">one project at one property.</strong>{" "}
          Separate properties typically require separate packs. A second property may be approved
          after a short call only when both share substantially the same design objective.
        </AlertDescription>
      </Alert>

      <CheckboxRow
        id="onePropertyConfirmed"
        checked={form.onePropertyConfirmed}
        onChange={(v) => update({ onePropertyConfirmed: v })}
        error={errors.onePropertyConfirmed}
      >
        Yes — this request is for <strong>one project at one property.</strong>
      </CheckboxRow>

      <CheckboxRow
        id="secondPropertyRequested"
        checked={form.secondPropertyRequested}
        onChange={(v) => update({ secondPropertyRequested: v })}
      >
        I&apos;m trying to cover a second property with the same design objective.
      </CheckboxRow>

      {form.secondPropertyRequested ? (
        <Alert className="border-orange-500/40 bg-orange-500/5 text-orange-100">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Thanks for the heads-up. A second property isn&apos;t automatically included. We&apos;ll
            route this to a short human review — use the call/WhatsApp option below and we&apos;ll
            confirm whether it can be fulfilled as one production cycle or needs a separate pack.
          </AlertDescription>
        </Alert>
      ) : null}

      <CheckboxRow
        id="hasPropertySurvey"
        checked={form.hasPropertySurvey}
        onChange={(v) => update({ hasPropertySurvey: v })}
      >
        I have a property survey I can upload.
      </CheckboxRow>
    </div>
  )
}
