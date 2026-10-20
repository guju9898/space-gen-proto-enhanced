/**
 * Homepage CTA experiment. No feature-flag service exists in this repo.
 * Middleware assigns `rs_home_exp` before render and forwards it on
 * `x-rs-home-exp` so the first HTML paint matches the cookie (no flicker).
 *
 * Variant A — existing paid homepage CTA.
 * Variant B — guest Studio primary CTA; paid plan stays secondary.
 */

export const HOME_EXPERIMENT_COOKIE = "rs_home_exp"
export const HOME_EXPERIMENT_HEADER = "x-rs-home-exp"
export const HOME_EXPERIMENT_MAX_AGE_SEC = 90 * 24 * 60 * 60

/** Existing guest Studio. Middleware sets renderspace_demo_mode when demo=true. */
export const GUEST_STUDIO_HREF = "/studio/exterior?demo=true"

/** Paid First Job Test. Price copy must come from lib/seo/facts.ts, not a new literal. */
export const PAID_PLAN_HREF = "/onboarding?plan=starter"

export type HomeVariant = "a" | "b"

export function parseHomeVariant(value: string | null | undefined): HomeVariant | null {
  if (value === "a" || value === "b") return value
  return null
}

export function assignHomeVariant(random: () => number = Math.random): HomeVariant {
  return random() < 0.5 ? "a" : "b"
}

/**
 * Homepage only. Query `hp_variant` overrides and is persisted.
 * Missing cookie gets a sticky random assignment.
 */
export function decideHomeExperiment(input: {
  pathname: string
  cookie: string | null | undefined
  queryOverride: string | null | undefined
  random?: () => number
}): { variant: HomeVariant; shouldSetCookie: boolean } | null {
  if (input.pathname !== "/") return null
  const override = parseHomeVariant(input.queryOverride)
  const existing = parseHomeVariant(input.cookie)
  const variant = override ?? existing ?? assignHomeVariant(input.random)
  return { variant, shouldSetCookie: input.cookie !== variant }
}

/** Header wins (set by middleware this request); cookie is the fallback. Default A preserves the current paid homepage. */
export function resolveHomeVariant(
  headerValue: string | null | undefined,
  cookieValue: string | null | undefined
): HomeVariant {
  return parseHomeVariant(headerValue) ?? parseHomeVariant(cookieValue) ?? "a"
}
