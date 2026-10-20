import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { JsonLd } from "@/components/seo/JsonLd"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { AcademyView } from "@/components/conversion/group-7/AcademyView"
import { ACADEMY_LESSONS, lessonReadingMinutes } from "@/lib/academy/curriculum"
import { pageMetadata } from "@/lib/seo/metadata"
import { absoluteBlogUrl } from "@/lib/blog/site"

export const metadata: Metadata = pageMetadata({
  path: "/academy",
  title: "Contractor Academy: Visual Sales for Outdoor Projects",
  description:
    "Six lessons for landscape, pool, and design/build contractors: photograph the site, create a Renderspace concept, compare directions, and present it without calling it a permit plan.",
})

export default function AcademyPage() {
  const courseLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Renderspace Contractor Academy",
    itemListElement: ACADEMY_LESSONS.map((lesson, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteBlogUrl(`/academy/${lesson.slug}`),
      name: lesson.title,
    })),
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={courseLd} />
      <SiteHeader active="academy" />
      <AcademyView eventName="academy_entered" />
      <main className="container mx-auto px-4 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Contractor Academy</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold text-white md:text-5xl">
          Show the project before you price it
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          A short path for landscaping, outdoor-living, pool, and design/build contractors. Each lesson uses the Studio
          and gallery tools that are on the site today. The lessons are free to read.
        </p>
        <ol className="mt-12 grid gap-4 md:grid-cols-2">
          {ACADEMY_LESSONS.map((lesson, index) => (
            <li key={lesson.slug}>
              <Link
                href={`/academy/${lesson.slug}`}
                className="flex h-full flex-col overflow-hidden rounded-lg border border-[#343434] bg-[#0d1119] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Image
                  src={lesson.image.src}
                  alt={lesson.image.alt}
                  width={1200}
                  height={800}
                  className="h-44 w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs text-muted-foreground">
                    Lesson {index + 1} · {lesson.setting} · {lessonReadingMinutes(lesson)} min read
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{lesson.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{lesson.summary}</p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <SiteFooter />
    </div>
  )
}
