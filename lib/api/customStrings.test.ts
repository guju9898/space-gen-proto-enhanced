import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { buildGeminiPrompt } from "./buildGeminiPrompt"
import { buildPrompt } from "./generateImage"
import { exteriorDefaults, interiorDefaults, landscapeDefaults } from "@/lib/studio/defaults"

/**
 * Guard for the Studio's most important promise: anything typed into any control
 * reaches the render prompt. The field list is read from the Studio pages, so a
 * new control that the prompt builder ignores fails this test.
 */
function studioKeys(studio: "landscape" | "exterior" | "interior"): { fields: string[]; advanced: string[] } {
  const src = readFileSync(path.join(process.cwd(), "app/studio", studio, "page.tsx"), "utf8")
  const fields = [...src.matchAll(/handleConfigChange\("([a-zA-Z]+)"/g)].map((m) => m[1])
  const advanced = [...src.matchAll(/advanced:\s*\{[^}]*?([a-zA-Z]+):\s*value/g)].map((m) => m[1])
  const skip = new Set(["image", "realism"])
  return {
    fields: [...new Set(fields)].filter((k) => !skip.has(k)),
    advanced: [...new Set(advanced)],
  }
}

function token(key: string): string {
  return `zq-${key.toLowerCase()}-custom`
}

describe("every Studio field carries typed text into the prompt", () => {
  for (const studio of ["landscape", "exterior"] as const) {
    it(`${studio}: each field`, () => {
      const { fields } = studioKeys(studio)
      assert.ok(fields.length >= 10, `found only ${fields.length} fields in ${studio}`)
      const defaults = studio === "landscape" ? landscapeDefaults : exteriorDefaults
      for (const key of fields) {
        const config: Record<string, unknown> = { ...defaults, renderType: studio, [key]: token(key) }
        const prompt = buildGeminiPrompt(config)
        assert.ok(prompt.includes(token(key)), `${studio}.${key} was dropped from the prompt`)
      }
    })

    it(`${studio}: each advanced field`, () => {
      const { advanced } = studioKeys(studio)
      const defaults = studio === "landscape" ? landscapeDefaults : exteriorDefaults
      for (const key of advanced) {
        const config: Record<string, unknown> = {
          ...defaults,
          renderType: studio,
          advanced: { ...(defaults.advanced ?? {}), [key]: token(key) },
        }
        assert.ok(buildGeminiPrompt(config).includes(token(key)), `${studio}.advanced.${key} was dropped`)
      }
    })
  }

  it("interior: each field", () => {
    const { fields } = studioKeys("interior")
    assert.ok(fields.length >= 15, `found only ${fields.length} interior fields`)
    for (const key of fields) {
      const prompt = buildPrompt({ ...interiorDefaults, [key]: token(key) })
      assert.ok(prompt.includes(token(key)), `interior.${key} was dropped from the prompt`)
    }
  })

  it("typed words in percent fields are kept", () => {
    const prompt = buildGeminiPrompt({ ...landscapeDefaults, renderType: "landscape", plantingDensity: "lush", lightingIntensity: "75" })
    assert.match(prompt, /planting density: lush/)
    assert.match(prompt, /lighting intensity: 75%/)
  })

  it("a typed theme or type replaces the defaults instead of contradicting them", () => {
    const landscape = buildGeminiPrompt({ ...landscapeDefaults, renderType: "landscape", themeStyle: "Texas Hill Country" })
    assert.match(landscape, /Texas Hill Country theme/)
    assert.doesNotMatch(landscape, /modern aesthetic/)

    const exterior = buildGeminiPrompt({ ...exteriorDefaults, renderType: "exterior", architecturalStyle: "craftsman", exteriorType: "two-story farmhouse" })
    assert.match(exterior, /craftsman two-story farmhouse/)
    assert.doesNotMatch(exterior, /modern aesthetic/)
  })

  it("'none' never reaches the model", () => {
    const prompt = buildGeminiPrompt({ ...landscapeDefaults, renderType: "landscape", waterFeature: "none", structures: "pergola" })
    assert.doesNotMatch(prompt, /\bnone\b/)
    assert.match(prompt, /pergola/)
  })

  it("untouched Interior defaults add nothing new (no surprise architect or lens)", () => {
    const prompt = buildPrompt({ ...interiorDefaults })
    assert.doesNotMatch(prompt, /architectural influence|lens|floor plan|geometry/)
  })
})
