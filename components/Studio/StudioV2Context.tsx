"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { STUDIO_V2_COOKIE, studioV2Enabled } from "@/lib/studio/flags"
import { studioKindFromPath, type StudioKind } from "@/lib/studio/lastStudio"

export type StudioV2State = {
  enabled: boolean
  studio: StudioKind | null
  /** A site photo is uploaded (Interior always counts as photo mode: it requires one). */
  hasPhoto: boolean
  /** User chose "Explore ideas without a photo". */
  noPhotoMode: boolean
  /** Camera/composition controls are hidden in photo mode until the user shows them. */
  showCameraControls: boolean
  setShowCameraControls: (next: boolean) => void
}

const StudioV2Context = React.createContext<StudioV2State>({
  enabled: false,
  studio: null,
  hasPhoto: false,
  noPhotoMode: false,
  showCameraControls: true,
  setShowCameraControls: () => {},
})

/** Reads the rollout switch once on mount (Studio pages render nothing before mount). */
export function useStudioV2Flag(): boolean {
  const [enabled, setEnabled] = React.useState(false)
  React.useEffect(() => {
    const result = studioV2Enabled({
      env: process.env.NEXT_PUBLIC_STUDIO_V2,
      cookie: document.cookie,
      search: window.location.search,
    })
    if (result.setCookie === "1") document.cookie = `${STUDIO_V2_COOKIE}=1; path=/; max-age=2592000; samesite=lax`
    if (result.setCookie === "0") document.cookie = `${STUDIO_V2_COOKIE}=; path=/; max-age=0; samesite=lax`
    setEnabled(result.enabled)
  }, [])
  return enabled
}

export function StudioV2Provider({
  enabled,
  hasPhoto,
  noPhotoMode,
  children,
}: {
  enabled: boolean
  hasPhoto: boolean
  noPhotoMode: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const studio = studioKindFromPath(pathname)
  const [showCameraControls, setShowCameraControls] = React.useState(false)
  const value = React.useMemo<StudioV2State>(
    () => ({
      enabled,
      studio,
      hasPhoto: studio === "interior" ? true : hasPhoto,
      noPhotoMode,
      showCameraControls,
      setShowCameraControls,
    }),
    [enabled, studio, hasPhoto, noPhotoMode, showCameraControls]
  )
  return <StudioV2Context.Provider value={value}>{children}</StudioV2Context.Provider>
}

export function useStudioV2(): StudioV2State {
  return React.useContext(StudioV2Context)
}
