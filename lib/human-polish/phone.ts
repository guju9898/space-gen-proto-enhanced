/**
 * Phone normalization for Human Polish first-purchase eligibility (§2.1 / §7.3).
 *
 * Robust server-side E.164 normalization backed by libphonenumber-js.
 * - Accepts an optional default country (used only when the input has no
 *   explicit country code). The form default is US when nothing is selected.
 * - Rejects invalid numbers rather than generating a false eligibility key.
 * - Returns a canonical E.164 string used for storage and comparison.
 *
 * Server-only: do not call from browser code and never expose phone numbers to GA.
 */

import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js"

export type NormalizePhoneResult =
  | { ok: true; normalized: string; e164: string; country: CountryCode | undefined }
  | { ok: false; error: string }

export const DEFAULT_PHONE_COUNTRY: CountryCode = "US"

/**
 * Normalize a phone number to E.164.
 *
 * @param input Raw phone string (any common format).
 * @param defaultCountry Fallback country when the input omits a country code.
 *   Prefer US only when no country has been selected upstream.
 */
export function normalizePhone(
  input: unknown,
  defaultCountry: CountryCode = DEFAULT_PHONE_COUNTRY
): NormalizePhoneResult {
  if (typeof input !== "string" || !input.trim()) {
    return { ok: false, error: "Phone number is required." }
  }

  const parsed = parsePhoneNumberFromString(input.trim(), defaultCountry)
  if (!parsed || !parsed.isValid()) {
    return { ok: false, error: "Enter a valid phone number." }
  }

  const e164 = parsed.number // canonical E.164, e.g. +15551234567

  return {
    ok: true,
    normalized: e164,
    e164,
    country: parsed.country,
  }
}
