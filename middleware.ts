import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "www.renderspace.ai"
const DEMO_MODE_COOKIE = "renderspace_demo_mode"

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname
  if (host === "renderspace.ai") {
    const path = request.nextUrl.pathname + request.nextUrl.search
    const url = new URL(path, `https://${CANONICAL_HOST}`)
    return NextResponse.redirect(url, 308)
  }

  const pathname = request.nextUrl.pathname
  const isStudio = pathname.startsWith("/studio")
  const isDemo = request.nextUrl.searchParams.get("demo") === "true"

  const res = NextResponse.next()

  if (isStudio) {
    if (isDemo) {
      res.cookies.set(DEMO_MODE_COOKIE, "1", { path: "/", maxAge: 60 * 60 })
    } else {
      res.cookies.delete(DEMO_MODE_COOKIE)
    }
  }

  return res
}
