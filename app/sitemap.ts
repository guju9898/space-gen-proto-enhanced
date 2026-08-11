import type { MetadataRoute } from "next"
import { getAllPostMetas } from "@/lib/blog/posts"
import { absoluteBlogUrl } from "@/lib/blog/site"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteBlogUrl("/"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/pricing"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/faq"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/gallery"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/contractor-demo"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/mockup-method"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/human-polish"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/blog"), lastModified: new Date("2026-08-11") },
  ]

  const posts = getAllPostMetas().map((post) => ({
    url: absoluteBlogUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.dateModified || post.datePublished),
  }))

  return [...staticRoutes, ...posts]
}
