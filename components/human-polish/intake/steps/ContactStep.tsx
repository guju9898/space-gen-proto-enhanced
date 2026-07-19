"use client"

import type { StepComponentProps } from "../intakeTypes"
import { CUSTOMER_ROLE_OPTIONS, PREFERRED_CONTACT_OPTIONS } from "../intakeConfig"
import { FieldShell, OptionCards, TextField } from "../fields"

export function ContactStep({ form, update, errors }: StepComponentProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contactName"
          label="Full name"
          required
          value={form.contactName}
          onChange={(v) => update({ contactName: v })}
          autoComplete="name"
          error={errors.contactName}
        />
        <TextField
          id="companyName"
          label="Company name"
          required
          value={form.companyName}
          onChange={(v) => update({ companyName: v })}
          autoComplete="organization"
          error={errors.companyName}
        />
        <TextField
          id="contactEmail"
          label="Email"
          type="email"
          inputMode="email"
          required
          value={form.contactEmail}
          onChange={(v) => update({ contactEmail: v })}
          autoComplete="email"
          error={errors.contactEmail}
        />
        <TextField
          id="contactPhone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          required
          value={form.contactPhone}
          onChange={(v) => update({ contactPhone: v })}
          autoComplete="tel"
          hint="We normalize and verify this securely on our servers."
          error={errors.contactPhone}
        />
      </div>

      <FieldShell id="customerRole" label="Your role" required error={errors.customerRole}>
        <OptionCards
          value={form.customerRole}
          options={CUSTOMER_ROLE_OPTIONS}
          onChange={(v) => update({ customerRole: v })}
        />
      </FieldShell>

      <FieldShell
        id="preferredContactMethod"
        label="Preferred contact method"
        required
        error={errors.preferredContactMethod}
      >
        <OptionCards
          value={form.preferredContactMethod}
          options={PREFERRED_CONTACT_OPTIONS}
          onChange={(v) => update({ preferredContactMethod: v })}
        />
      </FieldShell>
    </div>
  )
}
