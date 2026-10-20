/**
 * Staff capacity for done-for-you services.
 * A slot count is shown only when both the count and the next date are set
 * on the server. Missing or partial config stays unknown. Nothing here invents a number.
 */

export type PremiumService = "premium_onboarding" | "mailer" | "human_polish"

export type AvailabilityStatus = "unknown" | "available" | "waitlist"

export type PremiumAvailability = {
  service: PremiumService
  status: AvailabilityStatus
  /** Null when capacity is not configured. */
  slots: number | null
  /** YYYY-MM-DD when configured. */
  nextDate: string | null
  message: string
  showCapacityNote: boolean
}

const ENV_PREFIX: Record<PremiumService, string> = {
  premium_onboarding: "PREMIUM_ONBOARDING",
  mailer: "PREMIUM_MAILER",
  human_polish: "PREMIUM_HUMAN_POLISH",
}

const UNKNOWN_MESSAGE: Record<PremiumService, string> = {
  premium_onboarding: "Request the next available onboarding date.",
  mailer: "Request the next available onboarding date.",
  human_polish: "Request the next available production date.",
}

function parseSlots(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d{1,3}$/.test(raw.trim())) return null
  const value = Number(raw.trim())
  if (!Number.isInteger(value) || value > 100) return null
  return value
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${match[1]}-${match[2]}-${match[3]}`
}

export function formatAvailabilityDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function readPremiumAvailability(
  service: PremiumService,
  env: Record<string, string | undefined> = process.env
): PremiumAvailability {
  const prefix = ENV_PREFIX[service]
  const slots = parseSlots(env[`${prefix}_SLOTS`])
  const nextDate = parseDate(env[`${prefix}_NEXT_DATE`])
  if (slots === null || nextDate === null) {
    return {
      service,
      status: "unknown",
      slots: null,
      nextDate: null,
      message: UNKNOWN_MESSAGE[service],
      showCapacityNote: false,
    }
  }
  if (slots === 0) {
    return {
      service,
      status: "waitlist",
      slots: 0,
      nextDate,
      message: `No openings remain for ${formatAvailabilityDate(nextDate)}. ${UNKNOWN_MESSAGE[service]}`,
      showCapacityNote: false,
    }
  }
  const noun = slots === 1 ? "opening" : "openings"
  return {
    service,
    status: "available",
    slots,
    nextDate,
    message: `${slots} ${noun} for ${formatAvailabilityDate(nextDate)}.`,
    showCapacityNote: service !== "human_polish",
  }
}

export const CAPACITY_NOTE =
  "We onboard a limited number of done-for-you contractor accounts each month so every implementation receives personal attention."
