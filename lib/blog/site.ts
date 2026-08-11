/**
 * Canonical public site origin for blog SEO (www preferred).
 * Prefer NEXT_PUBLIC_APP_URL when set; fall back to production host.
 */

export function getBlogSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (raw) {
    try {
      const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      const url = new URL(withScheme)
      return `${url.protocol}//${url.host}`.replace(/\/+$/, "")
    } catch {
      // fall through
    }
  }
  return "https://www.renderspace.ai"
}

export function absoluteBlogUrl(path: string): string {
  const origin = getBlogSiteOrigin()
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${origin}${normalized}`
}

/** First Job Test / self-serve onboarding */
export const BLOG_CTA_SELF_SERVE = "/onboarding?plan=starter"
export const BLOG_CTA_PRICING = "/pricing"
export const BLOG_CTA_HUMAN_POLISH = "/human-polish"
export const BLOG_CTA_BUILD_READY =
  "/human-polish/intake?family=build-ready&package=essentials-2d"
export const BLOG_CTA_AI_PACK =
  "/human-polish/intake?family=ai-render-pack&package=25"
