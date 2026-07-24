/**
 * Human Polish™ V1 — server-authoritative pricing, limits, and delivery targets.
 * Source: docs/human-polish-v1-spec.md (§2.1, §2.2, §4.4, §7.2–7.3).
 *
 * Monetary amounts are integer USD cents. Never accept browser-supplied prices.
 */

import type {
  AiRenderPackPackage,
  BuildReadyPackage,
  HumanPolishPackage,
  HumanPolishServiceFamily,
} from "./types"

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

export const HUMAN_POLISH_UPLOAD_BUCKET = "human-polish-uploads" as const

/** Max files per request (§4.4 / §7.3). */
export const HUMAN_POLISH_MAX_FILES_PER_REQUEST = 25

/** Max bytes per file — 25 MB. */
export const HUMAN_POLISH_MAX_BYTES_PER_FILE = 25 * 1024 * 1024

/** Max total bytes per request — 250 MB. */
export const HUMAN_POLISH_MAX_BYTES_PER_REQUEST = 250 * 1024 * 1024

/** Allowed MIME types for private uploads. */
export const HUMAN_POLISH_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const

export type HumanPolishAllowedMimeType = (typeof HUMAN_POLISH_ALLOWED_MIME_TYPES)[number]

export const HUMAN_POLISH_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "pdf"] as const

/** Signed upload / download URL lifetime (seconds). Short-lived only. */
export const HUMAN_POLISH_SIGNED_URL_EXPIRES_IN = 60

/**
 * Draft recovery inactivity window (§4.1 / §7.3).
 * Clock resets on every successful authenticated draft/upload action —
 * not from original draft creation.
 */
export const HUMAN_POLISH_DRAFT_TTL_MS = 15 * 60 * 1000

export const HUMAN_POLISH_DRAFT_TTL_MINUTES = 15

/** Currency for Human Polish one-time payments. */
export const HUMAN_POLISH_CURRENCY = "usd" as const

// ---------------------------------------------------------------------------
// AI Render Pack — standard prices (cents)
// ---------------------------------------------------------------------------

export const AI_RENDER_PACK_STANDARD_PRICES_CENTS: Record<AiRenderPackPackage, number> = {
  "25": 39900, // $399
  "50": 69900, // $699
  "100": 119900, // $1,199
}

/** First-purchase promotion for the 25-pack only (§2.1). */
export const AI_RENDER_PACK_FIRST_PURCHASE_25_CENTS = 34900 // $349

/** Active Professional / Business subscriber prices before tax (§2.1). */
export const AI_RENDER_PACK_SUBSCRIBER_PRICES_CENTS: Record<AiRenderPackPackage, number> = {
  "25": 33915, // $339.15
  "50": 59415, // $594.15
  "100": 101915, // $1,019.15
}

export const AI_RENDER_PACK_SUBSCRIBER_DISCOUNT_PERCENT = 15

export const AI_RENDER_PACK_FIRST_BATCH_SIZES: Record<AiRenderPackPackage, number> = {
  "25": 5,
  "50": 10,
  "100": 15,
}

export const AI_RENDER_PACK_DELIVERY_TARGETS: Record<AiRenderPackPackage, string> = {
  "25": "24–48 hours",
  "50": "48–72 hours",
  "100": "3–5 business days",
}

export const AI_RENDER_PACK_RUSH_FEE_CENTS = 7900 // $79

export const AI_RENDER_PACK_RUSH_TARGETS: Partial<Record<AiRenderPackPackage, string>> = {
  "25": "Guaranteed 24-hour delivery",
  "50": "Guaranteed 48-hour delivery",
}

export const AI_RENDER_PACK_EXPIRATION_DAYS = 90

// ---------------------------------------------------------------------------
// Build-Ready — standard prices (cents)
// ---------------------------------------------------------------------------

export const BUILD_READY_STANDARD_PRICES_CENTS: Record<
  Exclude<BuildReadyPackage, "custom">,
  number
> = {
  "essentials-2d": 59900, // $599
  "essentials-3d": 89900, // $899
}

export const BUILD_READY_DELIVERY_TARGETS: Record<
  Exclude<BuildReadyPackage, "custom">,
  string
> = {
  "essentials-2d": "3–5 business days",
  "essentials-3d": "5–10 business days",
}

export const BUILD_READY_REVISION_ROUNDS: Record<
  Exclude<BuildReadyPackage, "custom">,
  number
> = {
  "essentials-2d": 2,
  "essentials-3d": 3,
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function getStandardAmountCents(
  family: HumanPolishServiceFamily,
  pkg: HumanPolishPackage
): number | null {
  if (family === "ai-render-pack") {
    if (pkg === "25" || pkg === "50" || pkg === "100") {
      return AI_RENDER_PACK_STANDARD_PRICES_CENTS[pkg]
    }
    return null
  }
  if (pkg === "essentials-2d" || pkg === "essentials-3d") {
    return BUILD_READY_STANDARD_PRICES_CENTS[pkg]
  }
  // custom — manually quoted
  return null
}

export function getFirstBatchSize(pkg: AiRenderPackPackage): number {
  return AI_RENDER_PACK_FIRST_BATCH_SIZES[pkg]
}

export function getDeliveryTarget(
  family: HumanPolishServiceFamily,
  pkg: HumanPolishPackage
): string | null {
  if (family === "ai-render-pack") {
    if (pkg === "25" || pkg === "50" || pkg === "100") {
      return AI_RENDER_PACK_DELIVERY_TARGETS[pkg]
    }
    return null
  }
  if (pkg === "essentials-2d" || pkg === "essentials-3d") {
    return BUILD_READY_DELIVERY_TARGETS[pkg]
  }
  return null
}

export function isAllowedMimeType(value: string): value is HumanPolishAllowedMimeType {
  return (HUMAN_POLISH_ALLOWED_MIME_TYPES as readonly string[]).includes(value)
}

/** Extension expected for a MIME type (primary). */
export const MIME_TO_EXTENSION: Record<HumanPolishAllowedMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "application/pdf": "pdf",
}

export const EXTENSION_TO_MIME: Record<string, HumanPolishAllowedMimeType> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  pdf: "application/pdf",
}
