"use client"

import type { StepComponentProps } from "../intakeTypes"
import { BUDGET_BAND_OPTIONS, PROJECT_TYPE_OPTIONS } from "../intakeConfig"
import { CheckboxRow, FieldShell, OptionCards, TextAreaField, TextField } from "../fields"

export function ProjectStep({ form, update, errors }: StepComponentProps) {
  return (
    <div className="space-y-5">
      <FieldShell id="projectType" label="Project type" required error={errors.projectType}>
        <OptionCards
          value={form.projectType}
          options={PROJECT_TYPE_OPTIONS}
          onChange={(v) => update({ projectType: v })}
        />
      </FieldShell>

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="projectName"
          label="Project name"
          required
          value={form.projectName}
          onChange={(v) => update({ projectName: v })}
          placeholder="e.g. Miller backyard transformation"
          error={errors.projectName}
        />
        <TextField
          id="projectAddress"
          label="Property address"
          value={form.projectAddress}
          onChange={(v) => update({ projectAddress: v })}
          placeholder="Street address (optional)"
          autoComplete="street-address"
        />
        <TextField
          id="projectCity"
          label="City"
          value={form.projectCity}
          onChange={(v) => update({ projectCity: v })}
          autoComplete="address-level2"
          error={errors.projectCity}
        />
        <TextField
          id="projectState"
          label="State / region"
          value={form.projectState}
          onChange={(v) => update({ projectState: v })}
          autoComplete="address-level1"
        />
      </div>

      <TextAreaField
        id="briefText"
        label="Project description"
        required
        rows={4}
        value={form.briefText}
        onChange={(v) => update({ briefText: v })}
        placeholder="Briefly describe the project, the space, and what you're trying to achieve."
        error={errors.briefText}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FieldShell id="budgetBand" label="Client budget band" error={errors.budgetBand}>
          <OptionCards
            value={form.budgetBand}
            options={BUDGET_BAND_OPTIONS}
            onChange={(v) => update({ budgetBand: v })}
            columns={2}
          />
        </FieldShell>
        <TextField
          id="deadlineDate"
          label="Presentation / estimate deadline"
          type="date"
          value={form.deadlineDate}
          onChange={(v) => update({ deadlineDate: v })}
          hint="Optional — helps us confirm capacity."
        />
      </div>

      <CheckboxRow
        id="hasApprovedConcept"
        checked={form.hasApprovedConcept}
        onChange={(v) => update({ hasApprovedConcept: v })}
      >
        An approved design concept already exists for this project.
      </CheckboxRow>
    </div>
  )
}
