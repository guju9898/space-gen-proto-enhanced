/**
 * Shared non-PII analytics param sanitization (usable from Node tests + client).
 */

const FORBIDDEN_PARAM_KEYS = new Set([
  "email",
  "phone",
  "contactname",
  "contact_name",
  "name",
  "company",
  "address",
  "requestid",
  "request_id",
  "sessionid",
  "session_id",
  "token",
  "paymenttoken",
  "drafttoken",
  "stripe",
  "filename",
  "path",
  "note",
  "description",
])

/** Strip any accidental PII-ish keys from params before gtag. */
export function sanitizeHumanPolishAnalyticsParams(
  params: Record<string, unknown> | undefined
): Record<string, string | number | boolean> {
  if (!params) return {}
  const out: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    const normalized = key.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase()
    if (FORBIDDEN_PARAM_KEYS.has(normalized)) continue
    if (value === null || value === undefined) continue
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      out[key] = value
    }
  }
  return out
}
