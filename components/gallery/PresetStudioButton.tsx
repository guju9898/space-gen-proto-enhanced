"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthContext"
import { trackGalleryEvent } from "@/components/gallery/analytics"
import {
  STORED_PRESET_PAYLOAD_KEY,
  studioPresetHref,
  type DesignPreset,
} from "@/lib/gallery/presets"

export function PresetStudioButton({ preset }: { preset: DesignPreset }) {
  const router = useRouter()
  const { status } = useAuth()

  return (
    <button
      type="button"
      disabled={status === "initializing"}
      onClick={() => {
        try {
          sessionStorage.setItem(STORED_PRESET_PAYLOAD_KEY, JSON.stringify(preset))
        } catch {
          /* The catalog can still resolve this slug after navigation. */
        }
        const href = studioPresetHref(preset, { demo: status !== "authenticated" })
        trackGalleryEvent("preset_studio_cta_clicked", {
          preset_id: preset.slug,
          category: preset.category,
          destination: `/studio/${preset.category}`,
        })
        router.push(href)
      }}
      className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 disabled:opacity-60 text-white px-4 py-2.5 rounded-md text-sm font-medium"
    >
      Create This Look on My Property
    </button>
  )
}
