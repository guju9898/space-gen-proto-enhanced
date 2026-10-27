/** Flat 1 credit per render (temporary pricing decision, Oct 2026). */
export const RENDER_CREDIT_COST = 1

export function renderCreditCost(_opts?: { hasReferenceImage?: boolean; renderType?: string }): number {
  return RENDER_CREDIT_COST
}
