import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  assignHomeVariant,
  decideHomeExperiment,
  parseHomeVariant,
  resolveHomeVariant,
} from "./experiment"

describe("homepage experiment", () => {
  it("parses only a and b", () => {
    assert.equal(parseHomeVariant("a"), "a")
    assert.equal(parseHomeVariant("b"), "b")
    assert.equal(parseHomeVariant("c"), null)
    assert.equal(parseHomeVariant(null), null)
  })

  it("keeps an existing assignment", () => {
    const decision = decideHomeExperiment({
      pathname: "/",
      cookie: "b",
      queryOverride: null,
      random: () => 0,
    })
    assert.deepEqual(decision, { variant: "b", shouldSetCookie: false })
  })

  it("lets hp_variant override and persist", () => {
    const decision = decideHomeExperiment({
      pathname: "/",
      cookie: "a",
      queryOverride: "b",
    })
    assert.deepEqual(decision, { variant: "b", shouldSetCookie: true })
  })

  it("assigns sticky variant when the cookie is missing", () => {
    assert.equal(
      decideHomeExperiment({ pathname: "/", cookie: null, queryOverride: null, random: () => 0.1 })
        ?.variant,
      "a"
    )
    assert.equal(
      decideHomeExperiment({ pathname: "/", cookie: null, queryOverride: null, random: () => 0.9 })
        ?.variant,
      "b"
    )
  })

  it("ignores other paths", () => {
    assert.equal(
      decideHomeExperiment({ pathname: "/pricing", cookie: null, queryOverride: "b" }),
      null
    )
  })

  it("resolves header, then cookie, then control", () => {
    assert.equal(resolveHomeVariant("b", "a"), "b")
    assert.equal(resolveHomeVariant(null, "a"), "a")
    assert.equal(resolveHomeVariant(null, null), "a")
    assert.equal(assignHomeVariant(() => 0.9), "b")
  })
})
