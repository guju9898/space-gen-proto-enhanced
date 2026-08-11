"use client"

import { useEffect } from "react"
import { trackBlogEvent } from "./analytics"

export function BlogPostViewTracker({
  slug,
  category,
}: {
  slug: string
  category: string
}) {
  useEffect(() => {
    trackBlogEvent("blog_post_viewed", { slug, category })
  }, [slug, category])
  return null
}
