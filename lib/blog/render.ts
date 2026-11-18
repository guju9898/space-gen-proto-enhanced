import { marked } from "marked"

marked.setOptions({
  gfm: true,
  breaks: false,
})

// Widths must be in Next's default images.deviceSizes, or /_next/image rejects the request.
const INLINE_IMAGE_WIDTHS = [640, 828, 1080, 1200]
const INLINE_IMAGE_SIZES = "(max-width: 768px) 100vw, 768px"

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function optimizedUrl(src: string, width: number): string {
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`
}

/**
 * Inline post images are full-size PNG renders. Serve them through the Next image optimizer
 * (resized WebP/AVIF, the same pipeline next/image uses) and lazy-load them, so they don't compete
 * with the featured image, which is the page's Largest Contentful Paint element.
 */
marked.use({
  renderer: {
    image({ href, title, text }) {
      if (!href) return ""
      const optimizable = href.startsWith("/") || /^https:\/\//i.test(href)
      const alt = escapeAttr(text ?? "")
      const titleAttr = title ? ` title="${escapeAttr(title)}"` : ""
      if (!optimizable) {
        return `<img src="${escapeAttr(href)}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`
      }
      const srcset = INLINE_IMAGE_WIDTHS.map((w) => `${escapeAttr(optimizedUrl(href, w))} ${w}w`).join(", ")
      const fallback = escapeAttr(optimizedUrl(href, 1080))
      return `<img src="${fallback}" srcset="${srcset}" sizes="${INLINE_IMAGE_SIZES}" alt="${alt}"${titleAttr} loading="lazy" decoding="async">`
    },
  },
})

/** Server-side Markdown → HTML for static blog bodies we author. */
export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string
}
