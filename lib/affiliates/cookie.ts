import { normalizeAffiliateCode } from "@/lib/affiliates/codes"

export type ParsedAffiliateCookie = {
  code: string
  issuedAt: Date
}

/** `CODE.epochSeconds`. Invalid or expired cookies are ignored, not overwritten by callers. */
export function parseAffiliateCookie(
  value: string | undefined | null,
  now: Date,
  windowDays: number
): ParsedAffiliateCookie | null {
  if (!value) return null
  const [rawCode, rawIssued] = value.split(".")
  const code = normalizeAffiliateCode(rawCode)
  const issuedSeconds = Number(rawIssued)
  if (!code || !Number.isFinite(issuedSeconds)) return null
  const issuedAt = new Date(issuedSeconds * 1000)
  if (Number.isNaN(issuedAt.getTime())) return null
  const expiresAt = issuedAt.getTime() + windowDays * 24 * 60 * 60 * 1000
  if (now.getTime() >= expiresAt) return null
  return { code, issuedAt }
}

export function serializeAffiliateCookie(code: string, issuedAt: Date): string {
  return `${code}.${Math.floor(issuedAt.getTime() / 1000)}`
}
