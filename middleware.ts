import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const CANONICAL_HOST = "www.renderspace.ai"

export function middleware(request: NextRequest) {
  const host = request.nextUrl.hostname
  if (host === "renderspace.ai") {
    const path = request.nextUrl.pathname + request.nextUrl.search
    const url = new URL(path, `https://${CANONICAL_HOST}`)
    return NextResponse.redirect(url, 308)
  }
  return NextResponse.next()
}
