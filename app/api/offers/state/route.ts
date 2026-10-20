import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { parseLifecycleState, recordLifecycleEvent, serializeLifecycleState } from "@/lib/offers/state"

export const runtime = "nodejs"

const COOKIE = "rs_lifecycle"
const OFFER_ID = /^[a-z0-9-]{3,60}$/

/** Records an impression or dismissal. Does not grant a discount. */
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  if (!body || typeof body !== "object") return NextResponse.json({ ok: false }, { status: 400 })
  const event = (body as { event?: unknown }).event
  const offerId = (body as { offerId?: unknown }).offerId
  if ((event !== "impression" && event !== "dismiss") || typeof offerId !== "string" || !OFFER_ID.test(offerId)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const jar = await cookies()
  const next = recordLifecycleEvent(parseLifecycleState(jar.get(COOKIE)?.value), event, offerId, new Date())
  jar.set(COOKIE, serializeLifecycleState(next), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  })
  return NextResponse.json({ ok: true })
}
