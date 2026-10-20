"use client"

import { useDesignConfig } from "@/hooks/useDesignConfig"
import type { GalleryPresetState } from "@/components/gallery/useGalleryPreset"
import { editPresetBrief } from "@/lib/gallery/preset-brief"
import type { StudioCategory } from "@/lib/gallery/presets"

export function GalleryPresetBanner({
  category,
  state,
  hasPhoto,
  brief,
}: {
  category: StudioCategory
  state: GalleryPresetState
  hasPhoto: boolean
  brief: string
}) {
  const { updateTypeConfig } = useDesignConfig()
  if (!state.notice && !state.preset) return null

  return (
    <div className="rounded-xl border border-[#343434] bg-[#191f33]/60 p-4 space-y-3">
      {state.notice && <p className="text-sm text-muted-foreground">{state.notice}</p>}
      {state.preset && (
        <>
          <p className="text-sm text-white">
            Starting from <span className="font-medium">{state.preset.title}</span>. Every setting below can be changed.
          </p>
          {!hasPhoto && (
            <p className="text-sm text-muted-foreground">
              Upload a photo of your property. The preset only sets the design direction.
            </p>
          )}
          <label className="block text-sm text-muted-foreground">
            Design notes
            <textarea
              value={brief}
              maxLength={240}
              rows={3}
              onChange={(event) => {
                updateTypeConfig(category, "presetBrief", editPresetBrief(event.target.value))
              }}
              className="mt-1 w-full rounded-md border border-[#343434] bg-[#101010] px-3 py-2 text-sm text-white"
            />
          </label>
        </>
      )}
    </div>
  )
}
