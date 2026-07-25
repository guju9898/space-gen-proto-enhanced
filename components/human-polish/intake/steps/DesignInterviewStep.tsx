"use client"

import type { StepComponentProps } from "../intakeTypes"
import { TONE_OPTIONS } from "../intakeConfig"
import { FieldShell, OptionCards, TextAreaField } from "../fields"

export function DesignInterviewStep({ form, update, errors }: StepComponentProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Type naturally — you don&apos;t need to know anything about prompting. Our team turns your
        answers into a production brief.
      </p>

      <TextAreaField
        id="designObjectives"
        label="Describe what the client wants this space to become"
        required
        rows={3}
        value={form.designObjectives}
        onChange={(v) => update({ designObjectives: v })}
        error={errors.designObjectives}
      />

      <TextAreaField
        id="mustHaveElements"
        label="What must appear in every concept?"
        required
        rows={3}
        value={form.mustHaveElements}
        onChange={(v) => update({ mustHaveElements: v })}
        error={errors.mustHaveElements}
      />

      <TextAreaField
        id="avoidElements"
        label="What should we avoid?"
        rows={2}
        value={form.avoidElements}
        onChange={(v) => update({ avoidElements: v })}
      />

      <TextAreaField
        id="materialPreferences"
        label="Plants, materials, colors, finishes, or features to prioritize"
        rows={2}
        value={form.materialPreferences}
        onChange={(v) => update({ materialPreferences: v })}
      />

      <TextAreaField
        id="clientWords"
        label="What did the client ask for in their own words?"
        rows={2}
        value={form.clientWords}
        onChange={(v) => update({ clientWords: v })}
      />

      <TextAreaField
        id="successDefinition"
        label="What would make the first batch feel successful to you?"
        rows={2}
        value={form.successDefinition}
        onChange={(v) => update({ successDefinition: v })}
      />

      <FieldShell id="tonePreference" label="Should the concepts lean…">
        <OptionCards
          value={form.tonePreference}
          options={TONE_OPTIONS}
          onChange={(v) => update({ tonePreference: v })}
        />
      </FieldShell>
    </div>
  )
}
