import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BlogArticleCta, RelatedPosts } from "@/components/blog/BlogArticleExtras"
import { BlogFooter, BlogHeader } from "@/components/blog/BlogChrome"
import { BlogPostViewTracker } from "@/components/blog/BlogPostViewTracker"
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from "@/lib/blog/json-ld"
import { getAllPostMetas, getPostBySlug, getRelatedPosts } from "@/lib/blog/posts"
import { absoluteBlogUrl } from "@/lib/blog/site"

type PageProps = {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllPostMetas().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return {}

  const url = absoluteBlogUrl(`/blog/${post.slug}`)
  const modified = post.dateModified || post.datePublished
  const images = post.featuredImage
    ? [{ url: absoluteBlogUrl(post.featuredImage), alt: post.featuredImageAlt || post.title }]
    : undefined

  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: post.seoTitle,
      description: post.description,
      url,
      siteName: "Renderspace",
      publishedTime: post.datePublished,
      modifiedTime: modified,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seoTitle,
      description: post.description,
      images: post.featuredImage ? [absoluteBlogUrl(post.featuredImage)] : undefined,
    },
  }
}

function formatDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`)
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  const related = getRelatedPosts(post)
  const modified = post.dateModified || post.datePublished
  const postingLd = buildBlogPostingJsonLd(post)
  const breadcrumbLd = buildBreadcrumbJsonLd(post)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BlogHeader />
      <BlogPostViewTracker slug={post.slug} category={post.category} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(postingLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="container mx-auto px-4 py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-8">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="hover:text-white">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/blog" className="hover:text-white">
                Blog
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-white/80 line-clamp-1">{post.title}</li>
          </ol>
        </nav>

        <article className="max-w-3xl mx-auto">
          <header className="mb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-3">
              <span className="uppercase tracking-wide">{post.category}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.datePublished}>Published {formatDate(post.datePublished)}</time>
              {modified !== post.datePublished ? (
                <>
                  <span aria-hidden>·</span>
                  <time dateTime={modified}>Updated {formatDate(modified)}</time>
                </>
              ) : null}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              {post.title}
            </h1>
            <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>
            <p className="text-xs text-muted-foreground mt-4">By {post.author}</p>
          </header>

          {post.featuredImage ? (
            <div className="relative aspect-[16/9] mb-10 rounded-xl overflow-hidden border border-[#343434]">
              <Image
                src={post.featuredImage}
                alt={post.featuredImageAlt || post.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
                priority
              />
            </div>
          ) : null}

          <div
            className="blog-prose prose prose-invert max-w-none
              prose-headings:text-white prose-headings:font-semibold
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
              prose-li:text-muted-foreground
              prose-table:text-sm
              prose-th:text-white prose-td:text-muted-foreground
              prose-img:rounded-lg
              overflow-x-auto"
            dangerouslySetInnerHTML={{ __html: post.contentHtml }}
          />

          <BlogArticleCta ctaType={post.ctaType} slug={post.slug} category={post.category} />
          <RelatedPosts posts={related} />
        </article>
      </main>
      <BlogFooter />
    </div>
  )
}
