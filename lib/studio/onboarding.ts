import type { StudioKind } from "@/lib/studio/lastStudio"

/** Spec F step 0: "What do you build?" One tap sets the default Studio. */
export const TRADES = [
  { id: "pools", label: "Pools and outdoor living", studio: "landscape" },
  { id: "landscaping", label: "Landscaping", studio: "landscape" },
  { id: "exteriors", label: "Remodeling and exteriors", studio: "exterior" },
  { id: "interiors", label: "Interiors", studio: "interior" },
] as const satisfies readonly { id: string; label: string; studio: StudioKind }[]

export type TradeId = (typeof TRADES)[number]["id"]

export const TRADE_STORAGE_KEY = "rs_trade"
export const HINT_STORAGE_PREFIX = "rs_hint_"
/** Fired on window when the Guide button asks for tips to show again. */
export const GUIDE_RESET_EVENT = "rs-guide-reset"

export const HINT_IDS = ["photo-coach", "read-result"] as const
export type HintId = (typeof HINT_IDS)[number]

export function tradeById(id: string | null | undefined) {
  return TRADES.find((t) => t.id === id) ?? null
}

/** "skipped" counts as answered so the question doesn't come back. */
export function isTradeAnswered(stored: string | null | undefined): boolean {
  return stored === "skipped" || tradeById(stored) !== null
}

export interface PhotoStats {
  width: number
  height: number
  /** Mean luma, 0–255. */
  brightness: number
}

export type PhotoWarning = "small" | "dark" | "portrait"

/**
 * Spec F step 2: soft warnings after upload. Never blocks a render.
 * Portrait is only flagged where a wide view usually works better (yards, house fronts).
 */
export function photoWarnings(stats: PhotoStats, studio: StudioKind | null): PhotoWarning[] {
  const out: PhotoWarning[] = []
  if (stats.width > 0 && stats.width < 1000) out.push("small")
  if (stats.brightness < 60) out.push("dark")
  if (studio !== "interior" && stats.height > stats.width * 1.1) out.push("portrait")
  return out
}

export const PHOTO_WARNING_TEXT: Record<PhotoWarning, string> = {
  small: "This photo is under 1,000 px wide. A larger photo gives a sharper render.",
  dark: "This photo looks dark. Even daylight usually gives a cleaner result.",
  portrait: "Upright photos crop the scene. A landscape-orientation photo usually frames the yard or house better.",
}

/** Mean luma of RGBA pixel data (Rec. 601 weights). */
export function meanBrightness(data: ArrayLike<number>): number {
  let sum = 0
  let n = 0
  for (let i = 0; i + 2 < data.length; i += 4) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    n++
  }
  return n ? sum / n : 255
}

/** Demo counter copy (spec H: "Two demo renders left…" only once carry-over exists, which it now does). */
export function demoRendersLeftText(remaining: number): { main: string; carry: string | null } {
  const main =
    remaining <= 0
      ? "You've used all 5 demo renders."
      : `You have ${remaining} demo render${remaining === 1 ? "" : "s"} left.`
  const carry = remaining < 5 ? "Your renders move into your account when you start a plan." : null
  return { main, carry }
}

/** Spec F step 4: the cost line under the Render button. */
export function renderCostText(opts: { demo: boolean; demoRemaining: number; credits: number | null; cost: number }): string {
  if (opts.demo) {
    return opts.demoRemaining > 0
      ? `Uses 1 of your ${opts.demoRemaining} demo render${opts.demoRemaining === 1 ? "" : "s"} left.`
      : "No demo renders left."
  }
  const unit = `${opts.cost} credit${opts.cost === 1 ? "" : "s"}`
  const balance = opts.credits === null ? "" : ` You have ${opts.credits}.`
  return `Uses ${unit}.${balance} Credits are only used when a render succeeds.`
}
