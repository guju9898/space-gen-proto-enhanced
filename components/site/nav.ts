import { PLANS, usd } from "@/lib/seo/facts"

export type NavKey = "home" | "gallery" | "pricing" | "faq" | "demo" | "mockup-method" | "human-polish" | "blog"

export type NavLink = { key: NavKey; href: string; label: string }

/** One navigation list for every marketing page (desktop nav + mobile menu). */
export const NAV_LINKS: NavLink[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "gallery", href: "/gallery", label: "Gallery" },
  { key: "pricing", href: "/pricing", label: "Pricing" },
  { key: "faq", href: "/faq", label: "FAQ" },
  { key: "demo", href: "/contractor-demo", label: "Demo" },
  { key: "mockup-method", href: "/mockup-method", label: "Mockup Method" },
  { key: "human-polish", href: "/human-polish", label: "Human Polish™" },
  { key: "blog", href: "/blog", label: "Blog" },
]

export type HeaderCta = { href: string; label: string }

export const DEFAULT_CTA: HeaderCta = {
  href: "/onboarding?plan=starter",
  label: `Try It for ${usd(PLANS.starter.priceUsd)}`,
}
