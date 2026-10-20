"use client"

import Link from "next/link"
import { trackAcademyEvent } from "@/components/conversion/group-7/analytics"
import type { AcademyCta } from "@/lib/academy/curriculum"

const LESSON_CONTEXT_KEY = "rs_academy_lesson"

export function AcademyCtas({ lesson, ctas }: { lesson: string; ctas: AcademyCta[] }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {ctas.map((cta) => (
        <Link
          key={cta.href + cta.label}
          href={cta.href}
          onClick={() => {
            try {
              sessionStorage.setItem(LESSON_CONTEXT_KEY, lesson)
            } catch {
              /* The lesson query on the Studio URL still carries the context. */
            }
            trackAcademyEvent("academy_studio_cta_clicked", {
              lesson,
              destination: cta.destination,
              preset: cta.presetSlug,
            })
            if (cta.presetSlug) {
              trackAcademyEvent("academy_preset_selected", { lesson, destination: "preset", preset: cta.presetSlug })
            }
          }}
          className={
            cta.primary
              ? "inline-flex h-10 items-center justify-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 text-sm font-medium text-white"
              : "inline-flex h-10 items-center justify-center rounded-md border border-white/30 px-4 text-sm text-white"
          }
        >
          {cta.label}
        </Link>
      ))}
    </div>
  )
}
