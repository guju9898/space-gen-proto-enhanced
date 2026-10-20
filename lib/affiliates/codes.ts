/** Affiliate codes are public referral tokens, not secrets. */

const CODE_PATTERN = /^[A-Z0-9]{4,16}$/
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export function normalizeAffiliateCode(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null
  const code = raw.trim().toUpperCase()
  if (!CODE_PATTERN.test(code)) return null
  return code
}

export function generateAffiliateCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join("")
}

export function sanitizeLandingPath(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null
  const path = raw.trim()
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("?") || path.includes("#")) {
    return null
  }
  if (path.length > 120) return path.slice(0, 120)
  return path
}
