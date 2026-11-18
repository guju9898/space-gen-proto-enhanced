import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyServerCookieWrites } from "./serverCookies"

describe("applyServerCookieWrites", () => {
  it("does not throw when cookieStore.set fails (Server Component context)", () => {
    const cookieStore = {
      set() {
        throw new Error("Cookies can only be modified in a Server Action or Route Handler.")
      },
    }
    assert.doesNotThrow(() =>
      applyServerCookieWrites(cookieStore, [
        { name: "sb-access-token", value: "refreshed", options: { path: "/" } },
      ])
    )
  })

  it("writes cookies when set is allowed (Server Action / Route Handler)", () => {
    const written: { name: string; value: string }[] = []
    const cookieStore = {
      set(name: string, value: string) {
        written.push({ name, value })
      },
    }
    applyServerCookieWrites(cookieStore, [
      { name: "sb-access-token", value: "new-access", options: { path: "/" } },
      { name: "sb-refresh-token", value: "new-refresh", options: { path: "/" } },
    ])
    assert.deepEqual(written, [
      { name: "sb-access-token", value: "new-access" },
      { name: "sb-refresh-token", value: "new-refresh" },
    ])
  })
})
