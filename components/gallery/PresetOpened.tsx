"use client"

import { useEffect } from "react"
import { trackGalleryEvent } from "@/components/gallery/analytics"

export function PresetOpened({ slug, category }: { slug: string; category: string }) {
  useEffect(() => {
    trackGalleryEvent("preset_opened", { preset_id: slug, category })
  }, [slug, category])
  return null
}
