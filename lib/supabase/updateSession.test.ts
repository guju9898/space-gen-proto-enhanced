import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { NextRequest, NextResponse } from "next/server"
import { updateSession } from "./updateSession"

describe("updateSession (proxy /studio refresh)", () => {
  it("puts refreshed auth cookies on the middleware response when getUser refreshes", async () => {
    const request = new NextRequest("https://www.renderspace.ai/studio/projects/proj-1", {
      headers: { cookie: "sb-access-token=expired; sb-refresh-token=valid-refresh" },
    })
    const initial = NextResponse.next({ request })

    const createClient = ((_url: string, _key: string, opts: { cookies: { getAll: () => unknown; setAll: (c: unknown[]) => void } }) => {
      return {
        auth: {
          async getUser() {
            // Simulate @supabase/ssr writing new tokens after refresh.
            opts.cookies.setAll([
              { name: "sb-access-token", value: "fresh-access", options: { path: "/" } },
              { name: "sb-refresh-token", value: "fresh-refresh", options: { path: "/" } },
            ])
            return { data: { user: { id: "user-1" } }, error: null }
          },
        },
      }
    }) as unknown as typeof import("@supabase/ssr").createServerClient

    const res = await updateSession(request, initial, {
      createClient,
      supabaseUrl: "https://example.supabase.co",
      supabaseAnonKey: "anon-key",
    })

    assert.equal(res.cookies.get("sb-access-token")?.value, "fresh-access")
    assert.equal(res.cookies.get("sb-refresh-token")?.value, "fresh-refresh")
    assert.equal(request.cookies.get("sb-access-token")?.value, "fresh-access")
  })

  it("returns the response unchanged when env is missing", async () => {
    const request = new NextRequest("https://www.renderspace.ai/studio/exterior")
    const initial = NextResponse.next({ request })
    const res = await updateSession(request, initial, {
      supabaseUrl: "",
      supabaseAnonKey: "",
    })
    assert.equal(res, initial)
  })
})
