import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { buildGeminiPrompt } from "../api/buildGeminiPrompt"
import { buildPrompt } from "../api/generateImage"
import {
  GALLERY_PRESETS,
  hasMeasuredPopularity,
  presetForPublishedRender,
  presetStudioPatch,
  resolveGalleryPreset,
  sanitizePresetControls,
  studioPresetHref,
  validateGalleryBotPreset,
} from "./presets"

describe("gallery presets", () => {
  it("seeds five regional presets with unique slugs", () => {
    assert.equal(GALLERY_PRESETS.length, 5)
    const slugs = new Set(GALLERY_PRESETS.map((preset) => preset.slug))
    assert.equal(slugs.size, 5)
    for (const preset of GALLERY_PRESETS) {
      assert.equal(preset.schemaVersion, 1)
      assert.equal(preset.category, "landscape")
      assert.equal(preset.usageCount, null)
      assert.equal(hasMeasuredPopularity(preset), false)
      assert.equal(resolveGalleryPreset(preset.slug)?.id, preset.id)
    }
  })

  it("does not attach a reference image unless it is an existing local gallery file", () => {
    const withImage = GALLERY_PRESETS.filter((preset) => preset.referenceImage)
    assert.deepEqual(
      withImage.map((preset) => preset.slug).sort(),
      ["cedar-pergola-outdoor-kitchen", "classical-dallas-landscape"]
    )
    for (const preset of withImage) {
      assert.match(preset.referenceImage!.src, /^\/gallery\/[a-z0-9-]+\.jpg$/)
    }
  })

  it("rejects unknown ids and drops unsupported controls and remote images", () => {
    assert.equal(resolveGalleryPreset("not-a-real-preset"), null)
    assert.equal(resolveGalleryPreset("../admin"), null)

    const checked = validateGalleryBotPreset({
      schemaVersion: 1,
      id: "bot-draft-preset",
      slug: "bot-draft-preset",
      title: "Bot draft",
      description: "A draft the Gallery Bot might submit.",
      category: "exterior",
      style: "Modern",
      materials: ["Limestone"],
      features: ["Entry"],
      promptBrief: "Cream limestone <script>alert(1)</script> facade",
      controls: {
        architecturalStyle: "modern",
        exteriorMaterials: "limestone",
        image: "https://evil.example/photo.jpg",
        __proto__: { admin: true },
      },
      referenceImage: { src: "https://evil.example/photo.jpg", alt: "nope" },
      publishedAt: "2026-10-18T15:00:00.000Z",
      featured: false,
      isNew: false,
      usageCount: null,
    })
    assert.equal(checked.ok, true)
    if (!checked.ok) return
    assert.deepEqual(checked.preset.controls, { architecturalStyle: "modern" })
    assert.equal(checked.preset.referenceImage, null)
    assert.equal(checked.preset.promptBrief.includes("<"), false)
    assert.match(checked.preset.promptBrief, /Cream limestone/)
  })

  it("rejects the wrong schema version", () => {
    const checked = validateGalleryBotPreset({
      schemaVersion: 2,
      id: "future-preset",
      slug: "future-preset",
      title: "Future",
      description: "Not this version.",
      category: "landscape",
      style: "Modern",
      publishedAt: "2026-10-18T15:00:00.000Z",
    })
    assert.equal(checked.ok, false)
  })

  it("builds a studio path without copying control values into the URL", () => {
    const preset = resolveGalleryPreset("pool-hardscape-transformation")
    assert.ok(preset)
    assert.equal(studioPresetHref(preset!, { demo: true }), "/studio/landscape?preset=pool-hardscape-transformation&demo=true")
    const patch = presetStudioPatch(preset!)
    assert.equal(patch.waterFeature, "pool")
    assert.equal(patch.hardscaping, "pavers")
    assert.match(String(patch.presetBrief), /limestone coping/)
    assert.equal("image" in patch, false)
  })

  it("maps a published job onto allowed controls and keeps other wording in the brief", () => {
    const preset = presetForPublishedRender({
      slug: "evening-pool-terrace",
      title: "Evening pool terrace",
      description: "A published Renderspace concept for a backyard pool terrace.",
      region: "Austin, TX",
      tags: ["pool"],
      publishedAt: new Date().toISOString(),
      conceptKey: null,
      renderType: "landscape",
      details: [
        { slot: "features", short: "Pool", text: "a swimming pool with a pergola" },
        { slot: "materials", short: "Stone", text: "stone coping" },
      ],
    })
    assert.ok(preset)
    assert.equal(preset!.category, "landscape")
    assert.equal(preset!.controls.waterFeature, "pool")
    assert.equal(preset!.controls.structures, "pergola")
    assert.equal(preset!.controls.wallMaterials, "stone")
    assert.equal(preset!.usageCount, null)
    assert.equal(preset!.featured, false)
  })

  it("prefers a catalog preset when the published concept key matches", () => {
    const preset = presetForPublishedRender({
      slug: "some-job",
      title: "Job",
      description: "Published job that points at a catalog preset.",
      region: null,
      tags: [],
      publishedAt: "2026-10-18T15:00:00.000Z",
      conceptKey: "cedar-pergola-outdoor-kitchen",
      renderType: "exterior",
      details: [],
    })
    assert.equal(preset?.slug, "cedar-pergola-outdoor-kitchen")
    assert.equal(preset?.category, "landscape")
  })

  it("drops landscape values the form does not offer", () => {
    assert.deepEqual(
      sanitizePresetControls("landscape", { style: "Craftsman", hardscaping: "stone", secret: "yes" }),
      { hardscaping: "stone" }
    )
  })
})

describe("preset brief in the existing prompt builders", () => {
  it("leaves landscape prompts unchanged when no brief is set", () => {
    const prompt = buildGeminiPrompt({ renderType: "landscape", gardenType: "Residential", style: "Modern" })
    assert.equal(prompt.includes("Design direction"), false)
  })

  it("appends a sanitized brief for landscape and exterior", () => {
    const landscape = buildGeminiPrompt({
      renderType: "landscape",
      gardenType: "Residential",
      presetBrief: "Texas limestone <b>boulders</b>",
    })
    assert.match(landscape, /Design direction: Texas limestone/)
    assert.equal(landscape.includes("<"), false)

    const exterior = buildGeminiPrompt({
      renderType: "exterior",
      architecturalStyle: "modern",
      presetBrief: "Warm limestone entry",
    })
    assert.match(exterior, /Design direction: Warm limestone entry/)
  })

  it("appends the brief to the interior prompt builder", () => {
    const prompt = buildPrompt({ roomType: "living", designStyle: "modern", presetBrief: "Oak floor and linen" })
    assert.match(prompt, /design direction: Oak floor and linen/)
  })
})
