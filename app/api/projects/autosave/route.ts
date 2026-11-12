import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { autosaveRender, type StudioType } from "@/lib/projects/autosave"
import { isObject, isString } from "@/lib/types/typeGuards"

export const runtime = "nodejs"

const STUDIOS: StudioType[] = ["interior", "exterior", "landscape"]

/**
 * POST /api/projects/autosave — saves a Studio render into the current job's project.
 * Body: { studioType, imageUrl, sourceImageUrl?, projectId?, timeZone? }.
 * A route (not a server action) because interior renders can arrive as large data URLs.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as unknown
  if (!isObject(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  const b = body as Record<string, unknown>
  const studioType = b.studioType as StudioType
  if (!STUDIOS.includes(studioType)) return NextResponse.json({ error: "Invalid studioType" }, { status: 400 })
  if (!isString(b.imageUrl) || !(b.imageUrl.startsWith("https://") || b.imageUrl.startsWith("data:image"))) {
    return NextResponse.json({ error: "Invalid imageUrl" }, { status: 400 })
  }

  const result = await autosaveRender(supabase, {
    userId: user.id,
    studioType,
    imageUrl: b.imageUrl,
    sourceImageUrl: isString(b.sourceImageUrl) ? b.sourceImageUrl : null,
    projectId: isString(b.projectId) ? b.projectId : null,
    timeZone: isString(b.timeZone) && b.timeZone.length < 64 ? b.timeZone : undefined,
  })
  if ("error" in result) return NextResponse.json(result, { status: 500 })
  return NextResponse.json(result)
}
