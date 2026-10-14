import type { Metadata } from "next"

export const SITE_NAME = "Renderspace"

type PageMetaInput = {
  /** Path of the page, e.g. "/pricing". Resolved against metadataBase (https://www.renderspace.ai). */
  path: `/${string}`
  /** Page title WITHOUT the " | Renderspace" suffix (the layout template adds it). */
  title: string
  /** 140–160 characters: the answer to the page's question plus a reason to click. */
  description: string
  /** true = use the title as-is (no template suffix). Use for the homepage. */
  absoluteTitle?: boolean
  robots?: Metadata["robots"]
}

/**
 * Standard metadata for every public page: unique title + description,
 * self-referencing canonical, and Open Graph / Twitter fields.
 *
 * openGraph and twitter are set explicitly with the full title because a child
 * segment's openGraph object REPLACES the parent's (shallow merge), and we don't
 * want og:title to depend on template inheritance.
 */
export function pageMetadata({ path, title, description, absoluteTitle, robots }: PageMetaInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_US",
      url: path,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
    ...(robots ? { robots } : {}),
  }
}
