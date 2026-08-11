import { absoluteBlogUrl } from "./site"
import type { BlogPostMeta } from "./types"

export function buildBlogPostingJsonLd(post: BlogPostMeta) {
  const url = absoluteBlogUrl(`/blog/${post.slug}`)
  const modified = post.dateModified || post.datePublished
  const image = post.featuredImage
    ? [absoluteBlogUrl(post.featuredImage)]
    : undefined

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: modified,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    author: {
      "@type": "Organization",
      name: post.author,
      url: absoluteBlogUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "Renderspace",
      url: absoluteBlogUrl("/"),
      logo: {
        "@type": "ImageObject",
        url: absoluteBlogUrl("/amethyst-flow.png"),
      },
    },
    ...(image ? { image } : {}),
  }
}

export function buildBreadcrumbJsonLd(post: BlogPostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteBlogUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: absoluteBlogUrl("/blog"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: absoluteBlogUrl(`/blog/${post.slug}`),
      },
    ],
  }
}
