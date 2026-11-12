import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { getCookieId, getDemoSupabase } from "@/lib/demo/usage"
import { claimGuestRenders } from "@/lib/demo/guestRenders"

export const runtime = "nodejs"

/**
 * POST /api/demo/claim — moves this browser's demo renders into the signed-in
 * account as a "Demo renders" project. Returns { claimed, projectId }.
 * No credits are charged or granted.
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const cookieId = getCookieId(request)
  if (!cookieId) return NextResponse.json({ claimed: 0, projectId: null })

  const admin = getDemoSupabase()
  if (!admin) return NextResponse.json({ claimed: 0, projectId: null })

  const result = await claimGuestRenders(admin, user.id, cookieId)
  return NextResponse.json(result)
}
