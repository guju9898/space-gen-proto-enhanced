/**
 * Shared subscription-status helpers (safe for client and server).
 */

/** Statuses that may use paid/trial generation features. */
export function isUsableSubscriptionStatus(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing"
}
