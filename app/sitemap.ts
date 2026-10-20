import type { MetadataRoute } from "next"
import { ACADEMY_LESSONS } from "@/lib/academy/curriculum"
import { getAllPostMetas } from "@/lib/blog/posts"
import { absoluteBlogUrl } from "@/lib/blog/site"
import { listPublishedRenders } from "@/lib/content/gallery"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteBlogUrl("/"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/pricing"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/faq"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/gallery"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/contractor-demo"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/mockup-method"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/human-polish"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/blog"), lastModified: new Date("2026-08-11") },
    { url: absoluteBlogUrl("/academy"), lastModified: new Date("2026-10-20") },
    ...ACADEMY_LESSONS.map((lesson) => ({
      url: absoluteBlogUrl(`/academy/${lesson.slug}`),
      lastModified: new Date("2026-10-20"),
    })),
  ]

  const posts = getAllPostMetas().map((post) => ({
    url: absoluteBlogUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.dateModified || post.datePublished),
  }))

  const renders = (await listPublishedRenders(500)).map((r) => ({
    url: absoluteBlogUrl(`/gallery/${r.slug}`),
    lastModified: new Date(r.publishedAt),
    images: [r.imageUrl],
  }))

  return [...staticRoutes, ...posts, ...renders]
}
