import Link from "next/link"
import {
  BLOG_CTA_AI_PACK,
  BLOG_CTA_BUILD_READY,
  BLOG_CTA_HUMAN_POLISH,
  BLOG_CTA_PRICING,
  BLOG_CTA_SELF_SERVE,
} from "@/lib/blog/site"
import type { BlogCtaType } from "@/lib/blog/types"
import { BlogCtaLink } from "./BlogCtaLink"

export function BlogArticleCta({
  ctaType,
  slug,
  category,
}: {
  ctaType: BlogCtaType
  slug: string
  category: string
}) {
  const shell =
    "mt-12 rounded-xl border border-[#343434] bg-[#191f33]/60 p-6 md:p-8"

  if (ctaType === "fork") {
    return (
      <aside className={shell} aria-label="Next steps">
        <h2 className="text-xl font-semibold text-white mb-3">Choose the right next step</h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Need fast self-serve concepts on a live estimate? Start with Renderspace. Want production
          handled for you? Start with Human Polish™.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <BlogCtaLink
            href={BLOG_CTA_SELF_SERVE}
            slug={slug}
            category={category}
            className="inline-flex justify-center items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Try the First Job Test — $19.99
          </BlogCtaLink>
          <BlogCtaLink
            href={BLOG_CTA_HUMAN_POLISH}
            slug={slug}
            category={category}
            className="inline-flex justify-center items-center rounded-md border border-[#343434] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Explore Human Polish™
          </BlogCtaLink>
        </div>
      </aside>
    )
  }

  if (ctaType === "human-polish") {
    return (
      <aside className={shell} aria-label="Human Polish next step">
        <h2 className="text-xl font-semibold text-white mb-3">
          Ready for an outsourced visualization workflow?
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Human Polish™ packages are scoped before you pay. Start with an AI Render Pack when you
          need concepts produced for you, or Build-Ready when you need a presentation package.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <BlogCtaLink
            href={BLOG_CTA_HUMAN_POLISH}
            slug={slug}
            category={category}
            className="inline-flex justify-center items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            View Human Polish™
          </BlogCtaLink>
          <BlogCtaLink
            href={BLOG_CTA_AI_PACK}
            slug={slug}
            category={category}
            className="inline-flex justify-center items-center rounded-md border border-[#343434] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Start an AI Render Pack intake
          </BlogCtaLink>
        </div>
      </aside>
    )
  }

  if (ctaType === "build-ready") {
    return (
      <aside className={shell} aria-label="Build-Ready next step">
        <h2 className="text-xl font-semibold text-white mb-3">
          Scope a Build-Ready presentation package
        </h2>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          Build-Ready is reviewed before payment. Packages support client and HOA/design-review
          presentations — they are not architecture, engineering, or permit documents.
        </p>
        <BlogCtaLink
          href={BLOG_CTA_BUILD_READY}
          slug={slug}
          category={category}
          className="inline-flex justify-center items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Start Build-Ready Essentials 2D intake
        </BlogCtaLink>
      </aside>
    )
  }

  return (
    <aside className={shell} aria-label="Try Renderspace">
      <h2 className="text-xl font-semibold text-white mb-3">Try it on a real estimate</h2>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        The First Job Test is $19.99 — 40 credits for 7 days — so you can run this workflow on an
        actual job before deciding whether it belongs in how you sell.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <BlogCtaLink
          href={BLOG_CTA_SELF_SERVE}
          slug={slug}
          category={category}
          className="inline-flex justify-center items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Start the First Job Test
        </BlogCtaLink>
        <BlogCtaLink
          href={BLOG_CTA_PRICING}
          slug={slug}
          category={category}
          className="inline-flex justify-center items-center rounded-md border border-[#343434] px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
        >
          See pricing
        </BlogCtaLink>
      </div>
    </aside>
  )
}

export function RelatedPosts({
  posts,
}: {
  posts: { slug: string; title: string; excerpt: string }[]
}) {
  if (!posts.length) return null
  return (
    <section className="mt-14 border-t border-[#343434] pt-10">
      <h2 className="text-xl font-semibold text-white mb-4">Related reading</h2>
      <ul className="space-y-4">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block rounded-lg border border-transparent hover:border-[#343434] hover:bg-[#191f33]/40 p-3 -mx-3"
            >
              <span className="text-white font-medium group-hover:text-primary transition-colors">
                {p.title}
              </span>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{p.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
