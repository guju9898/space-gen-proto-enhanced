import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AcademyCtas } from "@/components/conversion/group-7/AcademyCtas"
import { AcademyView } from "@/components/conversion/group-7/AcademyView"
import { JsonLd } from "@/components/seo/JsonLd"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { ACADEMY_LESSONS, getAcademyLesson, lessonNeighbors, lessonReadingMinutes } from "@/lib/academy/curriculum"
import { absoluteBlogUrl } from "@/lib/blog/site"
import { pageMetadata } from "@/lib/seo/metadata"

type Params = { slug: string }

export function generateStaticParams(): Params[] {
  return ACADEMY_LESSONS.map((lesson) => ({ slug: lesson.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const lesson = getAcademyLesson(slug)
  if (!lesson) return {}
  return pageMetadata({
    path: `/academy/${lesson.slug}`,
    title: lesson.title,
    description: lesson.summary,
  })
}

export default async function AcademyLessonPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const lesson = getAcademyLesson(slug)
  if (!lesson) notFound()
  const { previous, next } = lessonNeighbors(slug)
  const index = ACADEMY_LESSONS.findIndex((item) => item.slug === slug)
  const minutes = lessonReadingMinutes(lesson)
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "LearningResource",
    name: lesson.title,
    description: lesson.summary,
    url: absoluteBlogUrl(`/academy/${lesson.slug}`),
    isAccessibleForFree: true,
    learningResourceType: "Lesson",
    timeRequired: `PT${minutes}M`,
    provider: { "@type": "Organization", name: "Renderspace", url: absoluteBlogUrl("/") },
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={articleLd} />
      <SiteHeader active="academy" />
      <AcademyView eventName="academy_lesson_viewed" lesson={lesson.slug} />
      <main className="container mx-auto max-w-3xl px-4 py-12">
        <p className="text-sm text-muted-foreground">
          <Link href="/academy" className="hover:text-white">
            Contractor Academy
          </Link>
          <span aria-hidden="true"> · </span>
          Lesson {index + 1} of {ACADEMY_LESSONS.length}
        </p>
        <h1 className="mt-3 text-4xl font-bold text-white">{lesson.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {lesson.setting} · {minutes} min read
        </p>
        <p className="mt-4 text-muted-foreground">{lesson.summary}</p>
        <figure className="mt-8">
          <Image
            src={lesson.image.src}
            alt={lesson.image.alt}
            width={1200}
            height={800}
            className="w-full rounded-lg border border-[#343434] object-cover"
            priority
          />
          <figcaption className="mt-2 text-sm text-muted-foreground">{lesson.image.caption}</figcaption>
        </figure>
        <ol className="mt-10 space-y-8">
          {lesson.steps.map((step, stepIndex) => (
            <li key={step.title}>
              <h2 className="text-xl font-semibold text-white">
                {stepIndex + 1}. {step.title}
              </h2>
              <p className="mt-2 leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
        {lesson.notes.length > 0 ? (
          <aside className="mt-10 rounded-lg border border-[#343434] bg-[#0d1119] p-5">
            <h2 className="text-sm font-semibold text-white">Keep in mind</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {lesson.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </aside>
        ) : null}
        <div className="mt-10">
          <AcademyCtas lesson={lesson.slug} ctas={lesson.ctas} />
        </div>
        <nav aria-label="Related" className="mt-10">
          <h2 className="text-sm font-semibold text-white">Related</h2>
          <ul className="mt-3 space-y-2">
            {lesson.related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-primary hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Lessons" className="mt-10 flex flex-col gap-3 border-t border-[#343434] pt-6 sm:flex-row sm:justify-between">
          {previous ? (
            <Link href={`/academy/${previous.slug}`} className="text-sm text-white hover:underline">
              Previous: {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/academy/${next.slug}`} className="text-sm text-white hover:underline">
              Next: {next.title}
            </Link>
          ) : (
            <Link href="/academy" className="text-sm text-white hover:underline">
              Back to the Academy
            </Link>
          )}
        </nav>
      </main>
      <SiteFooter />
    </div>
  )
}
