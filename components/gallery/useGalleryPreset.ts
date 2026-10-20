"use client"

import { useEffect, useState } from "react"
import { trackGalleryEvent } from "@/components/gallery/analytics"
import {
  ACTIVE_PRESET_STORAGE_KEY,
  STORED_PRESET_PAYLOAD_KEY,
  isPresetSlug,
  presetStudioPatch,
  resolveGalleryPreset,
  validateGalleryBotPreset,
  type DesignPreset,
  type StudioCategory,
} from "@/lib/gallery/presets"
import { useDesignConfig } from "@/hooks/useDesignConfig"

export type GalleryPresetState = {
  notice: string | null
  preset: DesignPreset | null
  clear: () => void
}

function readRequestedSlug(): { kind: "absent" } | { kind: "invalid" } | { kind: "slug"; slug: string } {
  const query = new URLSearchParams(window.location.search).get("preset")
  if (query === null) return { kind: "absent" }
  return isPresetSlug(query) ? { kind: "slug", slug: query } : { kind: "invalid" }
}

function readStoredPreset(slug: string): DesignPreset | null {
  try {
    const raw = sessionStorage.getItem(STORED_PRESET_PAYLOAD_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const checked = validateGalleryBotPreset(parsed)
    if (!checked.ok || checked.preset.slug !== slug) return null
    return checked.preset
  } catch {
    return null
  }
}

export function clearActiveGalleryPreset(): void {
  try {
    sessionStorage.removeItem(ACTIVE_PRESET_STORAGE_KEY)
    sessionStorage.removeItem(STORED_PRESET_PAYLOAD_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * Apply a validated preset after the page has reset Studio defaults.
 * Declare this hook after that reset effect so the preset wins.
 */
export function useGalleryPreset(category: StudioCategory): GalleryPresetState {
  const { updateTypeConfig } = useDesignConfig()
  const [notice, setNotice] = useState<string | null>(null)
  const [preset, setPreset] = useState<DesignPreset | null>(null)

  useEffect(() => {
    const requested = readRequestedSlug()
    if (requested.kind === "absent") return
    if (requested.kind === "invalid") {
      setNotice("This design is no longer available. Studio opened with the usual settings.")
      clearActiveGalleryPreset()
      trackGalleryEvent("preset_loaded", { status: "invalid", category })
      return
    }

    const resolved = resolveGalleryPreset(requested.slug) ?? readStoredPreset(requested.slug)
    if (!resolved) {
      setNotice("This design is no longer available. Studio opened with the usual settings.")
      clearActiveGalleryPreset()
      trackGalleryEvent("preset_loaded", { preset_id: requested.slug, status: "invalid", category })
      return
    }
    if (resolved.category !== category) return

    const patch = presetStudioPatch(resolved)
    for (const [key, value] of Object.entries(patch)) {
      updateTypeConfig(category, key, value)
    }
    try {
      sessionStorage.setItem(ACTIVE_PRESET_STORAGE_KEY, resolved.slug)
    } catch {
      /* ignore */
    }
    setPreset(resolved)
    setNotice(null)
    trackGalleryEvent("preset_loaded", { preset_id: resolved.slug, status: "ok", category })
    // updateTypeConfig is recreated each render; the first call writes through functional setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  return {
    notice,
    preset,
    clear: clearActiveGalleryPreset,
  }
}
