import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isObject, isString } from "@/lib/types/typeGuards"
import { FEEDBACK_REASONS } from "@/lib/projects/feedback"

export const runtime = "nodejs"

/** POST /api/render-feedback — { renderUrl, studioType, rating: 1 | -1, reasons?, projectRenderId? } */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = (await request.json().catch(() => null)) as unknown
  if (!isObject(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  const b = body as Record<string, unknown>
  const rating = b.rating === 1 || b.rating === -1 ? b.rating : null
  const studio = b.studioType
  if (!rating || !isString(b.renderUrl) || !b.renderUrl.startsWith("https://") || !["interior", "exterior", "landscape"].includes(String(studio))) {
    return NextResponse.json({ error: "Invalid feedback" }, { status: 400 })
  }
  const allowed = new Set<string>(FEEDBACK_REASONS.map((r) => r.id))
  const reasons = Array.isArray(b.reasons) ? b.reasons.filter((r): r is string => isString(r) && allowed.has(r)) : []

  const { error } = await supabase.from("render_feedback").upsert(
    {
      user_id: user.id,
      render_url: b.renderUrl.slice(0, 2000),
      project_render_id: isString(b.projectRenderId) ? b.projectRenderId : null,
      studio_type: studio,
      rating,
      reasons,
    },
    { onConflict: "user_id,render_url" }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
