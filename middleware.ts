import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  HOME_EXPERIMENT_COOKIE,
  HOME_EXPERIMENT_HEADER,
  HOME_EXPERIMENT_MAX_AGE_SEC,
  decideHomeExperiment,
} from "@/components/conversion/group-1/experiment"

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

  const experiment = decideHomeExperiment({
    pathname,
    cookie: request.cookies.get(HOME_EXPERIMENT_COOKIE)?.value,
    queryOverride: request.nextUrl.searchParams.get("hp_variant"),
  })

  const requestHeaders = new Headers(request.headers)
  if (experiment) {
    requestHeaders.set(HOME_EXPERIMENT_HEADER, experiment.variant)
  }

  const res = NextResponse.next({ request: { headers: requestHeaders } })

  if (experiment?.shouldSetCookie) {
    res.cookies.set(HOME_EXPERIMENT_COOKIE, experiment.variant, {
      path: "/",
      maxAge: HOME_EXPERIMENT_MAX_AGE_SEC,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
    })
  }

  if (isStudio) {
    if (isDemo) {
      res.cookies.set(DEMO_MODE_COOKIE, "1", { path: "/", maxAge: 60 * 60 })
    } else {
      res.cookies.delete(DEMO_MODE_COOKIE)
    }
  }

  return res
}
