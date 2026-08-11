import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { BlogFooter, BlogHeader } from "@/components/blog/BlogChrome"
import { getAllPostMetas } from "@/lib/blog/posts"
import { absoluteBlogUrl } from "@/lib/blog/site"

export const metadata: Metadata = {
  title: "Contractor Visualization Blog | Renderspace",
  description:
    "Practical visualization and sales guidance for landscape, hardscape, outdoor-living, and design-build contractors.",
  alternates: {
    canonical: absoluteBlogUrl("/blog"),
  },
  openGraph: {
    type: "website",
    title: "Contractor Visualization Blog | Renderspace",
    description:
      "Practical visualization and sales guidance for landscape, hardscape, outdoor-living, and design-build contractors.",
    url: absoluteBlogUrl("/blog"),
    siteName: "Renderspace",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contractor Visualization Blog | Renderspace",
    description:
      "Practical visualization and sales guidance for landscape, hardscape, outdoor-living, and design-build contractors.",
  },
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

export default function BlogIndexPage() {
  const posts = getAllPostMetas()

  return (
    <div className="min-h-screen bg-background text-foreground">
      <BlogHeader />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-3xl mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Contractor visualization resources
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Practical visualization and sales guidance for landscape, hardscape, outdoor-living, and
            design-build contractors. Learn when self-serve Renderspace concepts are enough — and
            when Human Polish™ is the better fit.
          </p>
        </div>

        <ul className="grid gap-8 md:grid-cols-2 max-w-5xl">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="h-full flex flex-col border border-[#343434] rounded-xl overflow-hidden bg-[#191f33]/40">
                {post.featuredImage ? (
                  <Link href={`/blog/${post.slug}`} className="block relative aspect-[16/9] bg-black/40">
                    <Image
                      src={post.featuredImage}
                      alt={post.featuredImageAlt || post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </Link>
                ) : null}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span className="uppercase tracking-wide">{post.category}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="mt-4 text-sm text-primary hover:underline inline-flex"
                  >
                    Read article
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </main>
      <BlogFooter />
    </div>
  )
}
