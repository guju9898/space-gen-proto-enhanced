import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { GALLERY_PRESET_COOKIE, resolveGalleryPreset, studioPresetHref } from "@/lib/gallery/presets"

const DEMO_MODE_COOKIE = "renderspace_demo_mode"

export default async function StudioLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const demoModeCookie = cookieStore.get(DEMO_MODE_COOKIE)?.value === "1"

  if (demoModeCookie) {
    return <>{children}</>
  }

  // Prefer getUser() (validates JWT / refreshes). Cookie writes from a refresh are
  // ignored here via applyServerCookieWrites; proxy.ts refreshes /studio/* first.
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const preset = resolveGalleryPreset(cookieStore.get(GALLERY_PRESET_COOKIE)?.value)
    if (preset) {
      redirect(`/?login=1&next=${encodeURIComponent(studioPresetHref(preset))}`)
    }
    redirect("/?login=1")
  }

  return <>{children}</>
}
