/**
 * Class strings already used on Renderspace marketing pages.
 * New conversion UI should reuse these instead of inventing a palette.
 * Do not swap existing pages over to this module in a drive-by refactor.
 *
 * Canonical sources and the hex values are documented in
 * docs/conversion-optimization/MASTER_SPEC.md.
 */

export const marketingSurfaces = {
  page: "min-h-screen bg-background text-foreground",
  section: "container mx-auto px-4",
  card: "rounded-xl border border-[#343434] bg-[#191f33]/50",
  cardSolid: "rounded-xl border border-[#343434] bg-[#191f33]",
  cardMuted: "rounded-xl border border-[#343434] bg-[#191f33]/60",
  /** Header, hero, and pricing primary action. */
  primaryCta:
    "inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white rounded-md font-medium",
  /** Hero and mobile-nav secondary action. */
  secondaryCta:
    "inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white rounded-md font-medium",
  eyebrow: "text-sm font-medium text-primary",
  heading: "font-bold text-white",
  body: "text-muted-foreground",
  /** Tripwire / intro badge on the pricing page. */
  offerBadge:
    "bg-amber-600 text-white text-xs px-2.5 py-0.5 rounded-full font-medium",
} as const

export type MarketingSurfaceKey = keyof typeof marketingSurfaces
