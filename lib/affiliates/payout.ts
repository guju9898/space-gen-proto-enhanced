export type PayoutStatus = "requested" | "approved" | "paid" | "rejected"

export type PayoutDecision = {
  ok: boolean
  next: PayoutStatus | null
  reason: "ok" | "invalid_transition" | "hold_open" | "empty" | "missing_reference"
}

export function decidePayout(input: {
  status: PayoutStatus
  action: "approve" | "reject" | "mark_paid"
  now: Date
  earliestAvailableAt: Date | null
  amountCents: number
  externalReference?: string | null
}): PayoutDecision {
  if (input.amountCents <= 0) return { ok: false, next: null, reason: "empty" }
  if (input.action === "approve" && input.status === "requested") {
    if (!input.earliestAvailableAt || input.now.getTime() < input.earliestAvailableAt.getTime()) {
      return { ok: false, next: null, reason: "hold_open" }
    }
    return { ok: true, next: "approved", reason: "ok" }
  }
  if (input.action === "reject" && (input.status === "requested" || input.status === "approved")) {
    return { ok: true, next: "rejected", reason: "ok" }
  }
  if (input.action === "mark_paid" && input.status === "approved") {
    if (!input.externalReference || input.externalReference.trim().length < 3) {
      return { ok: false, next: null, reason: "missing_reference" }
    }
    return { ok: true, next: "paid", reason: "ok" }
  }
  return { ok: false, next: null, reason: "invalid_transition" }
}
