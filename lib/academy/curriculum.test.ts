import assert from "node:assert/strict"
import test from "node:test"
import { ACADEMY_LESSONS, getAcademyLesson, lessonReadingMinutes } from "@/lib/academy/curriculum"
import { resolveGalleryPreset } from "@/lib/gallery/presets"

test("academy lessons are a single ordered path with working studio and preset links", () => {
  assert.equal(ACADEMY_LESSONS.length, 6)
  const slugs = new Set(ACADEMY_LESSONS.map((lesson) => lesson.slug))
  assert.equal(slugs.size, 6)
  for (const lesson of ACADEMY_LESSONS) {
    assert.equal(getAcademyLesson(lesson.slug)?.title, lesson.title)
    assert.ok(lessonReadingMinutes(lesson) >= 1)
    assert.ok(lesson.steps.length >= 4)
    assert.ok(lesson.image.src.startsWith("/gallery/"))
    assert.equal(lesson.ctas.filter((cta) => cta.primary).length, 1)
    for (const cta of lesson.ctas) {
      assert.ok(cta.href.startsWith("/"))
      assert.equal(cta.href.includes("http"), false)
      if (cta.presetSlug) {
        assert.ok(resolveGalleryPreset(cta.presetSlug))
        assert.match(cta.href, new RegExp(`preset=${cta.presetSlug}`))
      }
      if (cta.destination === "guest_studio" || cta.destination === "preset") {
        assert.match(cta.href, /demo=true/)
        assert.match(cta.href, /lesson=/)
      }
    }
  }
})
