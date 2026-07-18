/**
 * Phone normalization for Human Polish first-purchase eligibility (§2.1 / §7.3).
 *
 * Foundation V1: deterministic digit-based normalization without an external
 * libphonenumber dependency. Flag: consider installing `libphonenumber-js`
 * before production launch if international numbers become common.
 */

export type NormalizePhoneResult =
  | { ok: true; normalized: string; e164Like: string }
  | { ok: false; error: string }

/**
 * Strips non-digits, applies a US/CA +1 default when 10 digits are present,
 * and returns a stable `phone_normalized` key (digits only, country code included).
 */
export function normalizePhone(input: unknown): NormalizePhoneResult {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Phone number is required." }
  }

  const trimmed = input.trim()
  const digits = trimmed.replace(/\D/g, "")

  if (digits.length < 10) {
    return { ok: false, error: "Phone number must include at least 10 digits." }
  }

  if (digits.length > 15) {
    return { ok: false, error: "Phone number is too long." }
  }

  let normalized = digits

  // US/CA: 10-digit local → prepend country code 1
  if (digits.length === 10) {
    normalized = `1${digits}`
  }

  // US/CA: already includes leading 1
  if (digits.length === 11 && digits.startsWith("1")) {
    normalized = digits
  }

  // International: keep full digit string as the eligibility key
  return {
    ok: true,
    normalized,
    e164Like: `+${normalized}`,
  }
}
