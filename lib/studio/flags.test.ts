import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { studioV2Enabled } from "./flags"

describe("studio v2 switch", () => {
  it("is off by default", () => {
    assert.deepEqual(studioV2Enabled({ env: undefined, cookie: "", search: "" }), { enabled: false, setCookie: null })
  })
  it("turns on and off per browser with ?studio_v2", () => {
    assert.deepEqual(studioV2Enabled({ env: undefined, cookie: "", search: "?studio_v2=1" }), { enabled: true, setCookie: "1" })
    assert.equal(studioV2Enabled({ env: undefined, cookie: "a=b; rs_studio_v2=1", search: "" }).enabled, true)
    assert.deepEqual(studioV2Enabled({ env: undefined, cookie: "rs_studio_v2=1", search: "?studio_v2=0" }), { enabled: false, setCookie: "0" })
  })
  it("is on for everyone when the env flag is set", () => {
    assert.equal(studioV2Enabled({ env: "true", cookie: "", search: "" }).enabled, true)
  })
})
