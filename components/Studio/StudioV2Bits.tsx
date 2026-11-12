"use client"

import type { ReactNode } from "react"
import { ImageOff, Info } from "lucide-react"
import { useCameraControlsHidden } from "@/components/Studio/useFieldPresentation"
import { useStudioV2 } from "@/components/Studio/StudioV2Context"
import { trackStudioEvent } from "@/components/Studio/analytics"

/** Hides its children (camera/composition controls) in v2 photo mode until the user shows them. */
export function CameraControlsGate({ children }: { children: ReactNode }) {
  const hidden = useCameraControlsHidden()
  return hidden ? null : <>{children}</>
}

/** Only renders in v2 (inside StudioLayout's provider). */
export function V2Only({ children }: { children: ReactNode }) {
  return useStudioV2().enabled ? <>{children}</> : null
}

/**
 * Under the photo upload (v2): an honest line about what AI keeps, plus the switch to
 * explore ideas without a photo. Wording follows spec section G: no "exact" or "guaranteed".
 */
export function PhotoStepFooter({
  hasPhoto,
  noPhotoMode,
  onNoPhotoModeChange,
  allowNoPhoto = true,
}: {
  hasPhoto: boolean
  noPhotoMode: boolean
  onNoPhotoModeChange?: (next: boolean) => void
  allowNoPhoto?: boolean
}) {
  const v2 = useStudioV2()
  if (!v2.enabled) return null
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <p className="flex gap-2">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          AI keeps your photo&apos;s viewpoint and main structures as closely as it can. Small details can shift. Use it to
          agree a direction with the client, not as a plan.
        </span>
      </p>
      {allowNoPhoto && !hasPhoto && onNoPhotoModeChange && (
        <button
          type="button"
          onClick={() => {
            const next = !noPhotoMode
            onNoPhotoModeChange(next)
            if (next) trackStudioEvent("no_photo_mode_selected", { studio: v2.studio ?? undefined })
          }}
          className="inline-flex items-center gap-1.5 font-medium text-foreground underline underline-offset-2"
        >
          <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
          {noPhotoMode ? "Use a photo instead" : "No photo? Explore ideas instead"}
        </button>
      )}
      {noPhotoMode && !hasPhoto && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-amber-200">
          Idea mode: the result is an idea image, not your client&apos;s property. Camera and layout controls are available below.
        </p>
      )}
    </div>
  )
}
