"use client"

import { fieldMeta, type FieldMeta } from "@/lib/studio/fields"
import { useStudioV2 } from "@/components/Studio/StudioV2Context"

export type FieldPresentation = {
  v2: boolean
  hidden: boolean
  label: string | undefined
  hint: string | undefined
  meta: FieldMeta | null
}

/**
 * How a Studio control presents itself. With v2 off this returns the control's own
 * label and never hides it, so the current Studio is unchanged.
 */
export function useFieldPresentation(label: string | undefined, placeholder?: string): FieldPresentation {
  const v2 = useStudioV2()
  if (!v2.enabled) return { v2: false, hidden: false, label, hint: undefined, meta: null }
  const meta = fieldMeta(v2.studio, label) ?? fieldMeta(v2.studio, placeholder)
  const cameraHidden = Boolean(meta?.camera) && v2.hasPhoto && !v2.noPhotoMode && !v2.showCameraControls
  return {
    v2: true,
    hidden: Boolean(meta?.hiddenInV2) || cameraHidden,
    label: label ? meta?.label ?? label : label,
    hint: meta?.hint,
    meta,
  }
}

/** Wraps unlabeled camera controls (the advanced architect/lens/geometry block). */
export function useCameraControlsHidden(): boolean {
  const v2 = useStudioV2()
  return v2.enabled && v2.hasPhoto && !v2.noPhotoMode && !v2.showCameraControls
}
