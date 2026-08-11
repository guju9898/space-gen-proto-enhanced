"use client"

import Link from "next/link"
import { trackBlogEvent } from "./analytics"

type Props = {
  href: string
  slug: string
  category: string
  children: React.ReactNode
  className?: string
}

export function BlogCtaLink({ href, slug, category, children, className }: Props) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackBlogEvent("blog_cta_clicked", {
          slug,
          category,
          destination: href.split("?")[0],
        })
      }
    >
      {children}
    </Link>
  )
}
