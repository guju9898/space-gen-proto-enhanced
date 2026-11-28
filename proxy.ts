import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import {
  HOME_EXPERIMENT_COOKIE,
  HOME_EXPERIMENT_HEADER,
  HOME_EXPERIMENT_MAX_AGE_SEC,
  decideHomeExperiment,
} from "@/components/conversion/group-1/experiment"
import {
  DEVELOPERS_MD_PATH,
  LLMS_TXT_PATH,
  prefersMarkdown,
} from "@/lib/docs/developersMarkdown"
import { GALLERY_PRESET_COOKIE, isPresetSlug } from "@/lib/gallery/presets"
import { updateSession } from "@/lib/supabase/updateSession"

const CANONICAL_HOST = "www.renderspace.ai"
const DEMO_MODE_COOKIE = "renderspace_demo_mode"

function withDocsDiscoveryHeaders(res: NextResponse): NextResponse {
  res.headers.set(
    "Link",
    `<${LLMS_TXT_PATH}>; rel="describedby", <${DEVELOPERS_MD_PATH}>; rel="alternate"; type="text/markdown"`
  )
  res.headers.set("Vary", "Accept")
  return res
}

export async function proxy(request: NextRequest) {
  const host = request.nextUrl.hostname
  if (host === "renderspace.ai") {
    const path = request.nextUrl.pathname + request.nextUrl.search
    const url = new URL(path, `https://${CANONICAL_HOST}`)
    return NextResponse.redirect(url, 308)
  }

  const pathname = request.nextUrl.pathname

  // Agent-friendly docs: Accept: text/markdown → /developers.md twin.
  if ((pathname === "/developers" || pathname === "/developers/") && prefersMarkdown(request.headers.get("accept"))) {
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = DEVELOPERS_MD_PATH
    return withDocsDiscoveryHeaders(NextResponse.rewrite(rewriteUrl))
  }

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

  let res = NextResponse.next({ request: { headers: requestHeaders } })

  if (pathname === "/developers" || pathname === "/developers/" || pathname === DEVELOPERS_MD_PATH || pathname === LLMS_TXT_PATH) {
    res = withDocsDiscoveryHeaders(res)
  }

  // Refresh expired Supabase sessions for Studio (including /studio/projects/*)
  // before other cookie writes, so setAll can replace `res` safely.
  if (isStudio) {
    res = await updateSession(request, res, { requestHeaders })
  }

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
    const preset = request.nextUrl.searchParams.get("preset")
    if (isPresetSlug(preset)) {
      res.cookies.set(GALLERY_PRESET_COOKIE, preset, {
        path: "/",
        maxAge: 60 * 60,
        sameSite: "lax",
        secure: request.nextUrl.protocol === "https:",
      })
    }
  }

  return res
}
