export type BlogCategory =
  | "Visualization"
  | "Comparison"
  | "Human Polish"
  | "Workflow"
  | "Use case"

export type BlogCtaType = "self-serve" | "human-polish" | "build-ready" | "fork"

export type BlogPostMeta = {
  slug: string
  title: string
  seoTitle: string
  description: string
  excerpt: string
  category: BlogCategory
  datePublished: string
  dateModified?: string
  author: string
  featuredImage?: string
  featuredImageAlt?: string
  primaryIntent: string
  ctaType: BlogCtaType
  relatedSlugs: string[]
}

export type BlogPost = BlogPostMeta & {
  contentMarkdown: string
  contentHtml: string
}
