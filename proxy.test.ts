import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { NextRequest } from "next/server"

describe("proxy", () => {
  it("rewrites /developers to Markdown when Accept includes text/markdown", async () => {
    const { proxy } = await import("./proxy")
    const req = new NextRequest("https://www.renderspace.ai/developers", {
      headers: { Accept: "text/markdown" },
    })
    const res = await proxy(req)
    assert.equal(res.status, 200)
    // Next rewrite exposes the destination on x-middleware-rewrite (or equivalent).
    const rewrite = res.headers.get("x-middleware-rewrite") || res.headers.get("x-nextjs-rewrite") || ""
    assert.match(rewrite, /\/developers\.md/)
    assert.match(res.headers.get("link") || "", /llms\.txt/)
    assert.match(res.headers.get("link") || "", /developers\.md/)
  })

  it("keeps www redirect and demo-mode cookie behaviour for /studio/*", async () => {
    // Force updateSession to no-op so this test does not call Supabase Auth.
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    process.env.NEXT_PUBLIC_SUPABASE_URL = ""
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ""

    try {
      const { proxy } = await import("./proxy")

      const apex = new NextRequest("https://renderspace.ai/studio/exterior")
      const redirected = await proxy(apex)
      assert.equal(redirected.status, 308)
      assert.match(redirected.headers.get("location") || "", /www\.renderspace\.ai\/studio\/exterior/)

      const demo = new NextRequest("https://www.renderspace.ai/studio/exterior?demo=true")
      const demoRes = await proxy(demo)
      assert.equal(demoRes.cookies.get("renderspace_demo_mode")?.value, "1")

      const projects = new NextRequest("https://www.renderspace.ai/studio/projects/abc")
      const projectsRes = await proxy(projects)
      assert.notEqual(projectsRes.cookies.get("renderspace_demo_mode")?.value, "1")
    } finally {
      if (prevUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL
      else process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl
      if (prevKey === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey
    }
  })
})
