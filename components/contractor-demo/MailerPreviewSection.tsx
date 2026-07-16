"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

interface MailerPreviewSectionProps {
  onViewed: () => void
}

const MAILERS = [
  { src: "/images/mailers/mailer-backyard.png", title: "Backyard Transformation Mailer" },
  { src: "/images/mailers/mailer-frontyard.png", title: "Front Yard Upgrade Mailer" },
  { src: "/images/mailers/mailer-outdoor.png", title: "Outdoor Living Concept Mailer" },
]

export function MailerPreviewSection({ onViewed }: MailerPreviewSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = sectionRef.current
    if (!element) return

    let hasTracked = false
    const observer = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((entry) => entry.isIntersecting)
        if (isVisible && !hasTracked) {
          hasTracked = true
          onViewed()
          observer.disconnect()
        }
      },
      { threshold: 0.35 }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [onViewed])

  return (
    <section ref={sectionRef} className="container mx-auto px-4 py-14">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-3">What Your Mailers Can Look Like</h2>
        <p className="text-muted-foreground text-center mb-8">
          Premium clients get branded outbound support so homeowners see the transformation before they call.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {MAILERS.map((mailer, idx) => (
            <article
              key={mailer.title}
              className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-3 shadow-lg"
              style={{ transform: `rotate(${idx === 1 ? "1.5deg" : idx === 2 ? "-1.5deg" : "-0.5deg"})` }}
            >
              <div className="relative aspect-[3/2] w-full rounded-lg overflow-hidden">
                <Image
                  src={mailer.src}
                  alt={mailer.title}
                  fill
                  className="object-cover object-center"
                  sizes="(min-width: 768px) 33vw, 100vw"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">{mailer.title}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

