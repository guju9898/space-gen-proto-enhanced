import { PLANS, usd } from "@/lib/seo/facts"

export type NavKey =
  | "home"
  | "gallery"
  | "pricing"
  | "faq"
  | "demo"
  | "academy"
  | "mockup-method"
  | "human-polish"
  | "blog"
  | "developers"

export type NavLink = { key: NavKey; href: string; label: string }

/**
 * Desktop header: four links, Login and one button, so the main action stands out.
 * Home is the logo. Everything else is in MORE_NAV_LINKS (mobile menu) and the footer.
 */
export const PRIMARY_NAV_LINKS: NavLink[] = [
  { key: "gallery", href: "/gallery", label: "Gallery" },
  { key: "pricing", href: "/pricing", label: "Pricing" },
  { key: "demo", href: "/contractor-demo", label: "Demo" },
  { key: "academy", href: "/academy", label: "Academy" },
]

/** Secondary pages: shown after the primary links in the mobile menu, and in the footer. */
export const MORE_NAV_LINKS: NavLink[] = [
  { key: "faq", href: "/faq", label: "FAQ" },
  { key: "mockup-method", href: "/mockup-method", label: "Mockup Method" },
  { key: "human-polish", href: "/human-polish", label: "Human Polish™" },
  { key: "blog", href: "/blog", label: "Blog" },
  { key: "developers", href: "/developers", label: "Developers" },
]

/** Full list, primary first (mobile menu). */
export const NAV_LINKS: NavLink[] = [{ key: "home", href: "/", label: "Home" }, ...PRIMARY_NAV_LINKS, ...MORE_NAV_LINKS]

export type HeaderCta = { href: string; label: string }

export const DEFAULT_CTA: HeaderCta = {
  href: "/onboarding?plan=starter",
  label: `Try It for ${usd(PLANS.starter.priceUsd)}`,
}
