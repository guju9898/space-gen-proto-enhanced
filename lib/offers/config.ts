/** Lifecycle thresholds. Change these constants; do not hard-code them in UI. */

export const LIFECYCLE_OFFERS_ENV = "LIFECYCLE_OFFERS_ENABLED"

export const LIFECYCLE_LIMITS = {
  /** Successful renders before a free or intro user sees a subscription offer. */
  generationRenders: 3,
  /** Successful renders before a Professional or Business user sees Human Polish. */
  repeatRenders: 5,
  /** Remaining credits at or below this share of the allowance. */
  lowCreditRemainingRatio: 0.2,
  maxImpressions: 3,
  dismissCooldownMs: 7 * 24 * 60 * 60 * 1000,
  /** Wait before replacing one offer with a different one. */
  switchCooldownMs: 24 * 60 * 60 * 1000,
} as const

export function lifecycleOffersEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env[LIFECYCLE_OFFERS_ENV] !== "false"
}
