/**
 * Stripe Coupon IDs are user-defined strings (often `coupon_…`, but custom ids are valid).
 * Reject empty / obviously wrong values; do not require a `coupon_` prefix.
 */
export function isStripeCouponId(value: unknown): value is string {
  if (typeof value !== "string") return false
  const id = value.trim()
  if (id.length < 3 || id.length > 200) return false
  if (/\s/.test(id)) return false
  // Price / product ids are not coupons
  if (id.startsWith("price_") || id.startsWith("prod_") || id.startsWith("sub_")) return false
  return /^[A-Za-z0-9_-]+$/.test(id)
}
