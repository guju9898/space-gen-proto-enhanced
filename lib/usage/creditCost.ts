/** Flat 1 credit per Studio / app render (temporary pricing decision, Oct 2026). */
export const RENDER_CREDIT_COST = 1

/** Public API renders cost more to cover automation/provider load. */
export const API_RENDER_CREDIT_COST = 2

export function renderCreditCost(_opts?: { hasReferenceImage?: boolean; renderType?: string }): number {
  return RENDER_CREDIT_COST
}

export function apiRenderCreditCost(): number {
  return API_RENDER_CREDIT_COST
}
