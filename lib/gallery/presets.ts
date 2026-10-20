/**
 * Versioned gallery design presets.
 *
 * A preset is a starting Studio configuration. Only keys and values that exist
 * on the live Studio controls are applied. Everything else is dropped.
 *
 * Canonical definitions live in this module. The Gallery Bot does not write
 * this file. See docs/conversion-optimization/GALLERY_PRESET_BOT.md.
 */

import { sanitizePresetBrief } from "@/lib/gallery/preset-brief"

export const PRESET_SCHEMA_VERSION = 1 as const

export const GALLERY_PRESET_COOKIE = "rs_gallery_preset"
export const ACTIVE_PRESET_STORAGE_KEY = "rs_active_preset"
export const STORED_PRESET_PAYLOAD_KEY = "rs_gallery_preset_payload"

export type StudioCategory = "interior" | "exterior" | "landscape"

export type DesignPreset = {
  schemaVersion: typeof PRESET_SCHEMA_VERSION
  id: string
  slug: string
  title: string
  description: string
  category: StudioCategory
  /** Human-readable style label for the gallery card. Not written to Studio unless it is also an allowed control. */
  style: string
  materials: string[]
  features: string[]
  /** Editable design note. Copied into the Studio `presetBrief` field. */
  promptBrief: string
  controls: Record<string, string | number>
  /** Existing on-site concept art only. Never a remote or invented project photo. */
  referenceImage: { src: string; alt: string } | null
  tags: string[]
  regions: string[]
  publishedAt: string
  featured: boolean
  /** Curator flag for designs added with this library. Not a usage metric. */
  isNew: boolean
  /** Completed renders that started from this preset. Null until a real count exists. */
  usageCount: number | null
}

const SLUG = /^[a-z0-9-]{3,80}$/
const LOCAL_GALLERY_IMAGE = /^\/gallery\/[a-z0-9-]+\.(jpg|jpeg|png|webp)$/

type ControlRule = { kind: "enum"; values: readonly string[] } | { kind: "number" }

const INTERIOR_CONTROLS: Record<string, ControlRule> = {
  roomType: { kind: "enum", values: ["living", "bedroom", "kitchen", "bathroom", "office", "dining"] },
  designStyle: { kind: "enum", values: ["modern", "minimalist", "scandinavian", "industrial", "bohemian", "traditional"] },
  colorPalette: { kind: "enum", values: ["neutral", "warm", "cool", "earthy", "pastel", "bold"] },
  lighting: { kind: "enum", values: ["natural", "warm", "cool", "dramatic", "ambient"] },
  timeOfDay: { kind: "enum", values: ["morning", "afternoon", "evening", "night"] },
  mood: { kind: "enum", values: ["calm", "energetic", "cozy", "luxurious", "playful"] },
  architect: { kind: "enum", values: ["foster", "hadid", "gehry", "nouvel", "koolhaas"] },
  lens: { kind: "enum", values: ["wide", "standard", "telephoto", "fisheye"] },
  typology: { kind: "enum", values: ["open", "closed", "semi-open", "split"] },
  geometry: { kind: "enum", values: ["rectangular", "square", "circular", "l-shaped", "u-shaped"] },
  roomLayout: { kind: "enum", values: ["open", "closed", "semi-open", "split", "studio", "loft"] },
  cameraAngle: { kind: "enum", values: ["eye level", "high angle", "low angle", "bird's eye", "worm's eye", "overhead"] },
  flooring: { kind: "enum", values: ["hardwood", "tile", "carpet", "concrete", "marble", "laminate", "vinyl"] },
  textures: { kind: "enum", values: ["smooth", "rough", "textured", "glossy", "matte", "natural"] },
  realism: { kind: "number" },
}

const EXTERIOR_CONTROLS: Record<string, ControlRule> = {
  exteriorType: { kind: "enum", values: ["house", "apartment", "commercial", "industrial", "institutional"] },
  architecturalStyle: { kind: "enum", values: ["modern", "traditional", "contemporary"] },
  surroundingEnvironment: { kind: "enum", values: ["urban", "suburban", "rural"] },
  colorPalette: { kind: "enum", values: ["neutral", "warm", "cool", "earthy", "bold"] },
  lighting: { kind: "enum", values: ["natural", "warm", "cool", "dramatic"] },
  timeOfDay: { kind: "enum", values: ["day", "night"] },
  exteriorMaterials: { kind: "enum", values: ["brick", "concrete", "wood", "stone", "metal", "glass", "stucco"] },
  roofStyle: { kind: "enum", values: ["gable", "hip", "flat", "shed", "mansard", "gambrel"] },
  outdoorFurnishings: { kind: "enum", values: ["patio set", "outdoor sofa", "dining set", "none"] },
  exteriorAccents: { kind: "enum", values: ["wood", "metal", "stone", "none"] },
  exteriorViews: { kind: "enum", values: ["front", "side", "back", "corner", "aerial"] },
  focalPoint: { kind: "enum", values: ["entrance", "windows", "roof", "balcony", "architectural detail", "landscaping", "none"] },
  symmetryType: { kind: "enum", values: ["symmetrical", "asymmetrical", "radial"] },
  symmetryLevel: { kind: "number" },
  landscapingElements: { kind: "enum", values: ["trees", "shrubs", "lawn", "garden beds", "pathways", "none"] },
  realism: { kind: "number" },
}

const LANDSCAPE_CONTROLS: Record<string, ControlRule> = {
  gardenType: { kind: "enum", values: ["Residential", "Commercial", "Public"] },
  lighting: { kind: "enum", values: ["Daylight", "Evening", "Night"] },
  themeStyle: { kind: "enum", values: ["zen", "tropical", "mediterranean", "cottage", "formal"] },
  timeOfDay: { kind: "enum", values: ["morning", "afternoon", "evening", "night"] },
  plantTypes: { kind: "enum", values: ["succulents", "trees", "shrubs", "flowers", "grasses", "vines"] },
  plantingDensity: { kind: "number" },
  topography: { kind: "enum", values: ["flat", "sloped", "terraced", "hilly"] },
  outdoorFurniture: { kind: "enum", values: ["bench", "outdoor sofa", "dining set", "hammock", "none"] },
  seatingFeature: { kind: "enum", values: ["bench", "outdoor-sofa", "dining-set", "hammock", "swing", "none"] },
  structures: { kind: "enum", values: ["pergola", "gazebo", "arbor", "trellis", "none"] },
  lightingIntensity: { kind: "number" },
  playActivityArea: { kind: "enum", values: ["playground", "sports court", "none"] },
  interactiveElements: { kind: "enum", values: ["stepping stones", "pathway", "bridge", "none"] },
  wallMaterials: { kind: "enum", values: ["stone", "brick", "wood", "concrete", "none"] },
  climateZone: { kind: "enum", values: ["temperate", "tropical", "arid", "continental"] },
  weather: { kind: "enum", values: ["sunny", "cloudy", "rainy", "foggy"] },
  scale: { kind: "enum", values: ["human", "grand", "intimate"] },
  geometry: { kind: "enum", values: ["rectangular", "square", "circular", "l-shaped", "u-shaped"] },
  gardenGeometry: { kind: "enum", values: ["rectangular", "square", "circular", "l-shaped", "u-shaped"] },
  cameraAngle: { kind: "enum", values: ["eye level", "high angle", "low angle", "bird's eye", "worm's eye", "overhead"] },
  wildlifeElements: { kind: "enum", values: ["birds", "butterflies", "none"] },
  hardscaping: { kind: "enum", values: ["gravel", "pavers", "concrete", "stone", "wood deck"] },
  waterFeature: { kind: "enum", values: ["fountain", "pond", "stream", "waterfall", "pool", "none"] },
  realism: { kind: "number" },
}

const CONTROL_RULES: Record<StudioCategory, Record<string, ControlRule>> = {
  interior: INTERIOR_CONTROLS,
  exterior: EXTERIOR_CONTROLS,
  landscape: LANDSCAPE_CONTROLS,
}

export function isPresetSlug(value: string | null | undefined): value is string {
  return typeof value === "string" && SLUG.test(value)
}

export function isStudioCategory(value: unknown): value is StudioCategory {
  return value === "interior" || value === "exterior" || value === "landscape"
}

function cleanList(value: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(value)) return []
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== "string") continue
    const text = item.replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim()
    if (!text) continue
    out.push(text.slice(0, maxLen))
    if (out.length >= maxItems) break
  }
  return out
}

function cleanLine(value: unknown, max: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/[\u0000-\u001F\u007F<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
}

function referenceImage(value: unknown): DesignPreset["referenceImage"] {
  if (!value || typeof value !== "object") return null
  const src = cleanLine((value as { src?: unknown }).src, 160)
  const alt = cleanLine((value as { alt?: unknown }).alt, 180)
  if (!LOCAL_GALLERY_IMAGE.test(src) || !alt) return null
  return { src, alt }
}

/** Drop unknown keys and values that the Studio form cannot show. */
export function sanitizePresetControls(
  category: StudioCategory,
  raw: unknown
): Record<string, string | number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  const rules = CONTROL_RULES[category]
  const out: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue
    const rule = rules[key]
    if (!rule) continue
    if (rule.kind === "number") {
      const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN
      if (!Number.isInteger(n) || n < 0 || n > 100) continue
      out[key] = n
      continue
    }
    if (typeof value !== "string") continue
    if (!rule.values.includes(value)) continue
    out[key] = value
  }
  return out
}

export type PresetValidation =
  | { ok: true; preset: DesignPreset }
  | { ok: false; errors: string[] }

/**
 * Validate a preset payload from a URL, cookie, or the Gallery Bot.
 * Unsupported controls are removed. A payload that is missing an identity or a category is rejected.
 */
export function validateGalleryBotPreset(input: unknown): PresetValidation {
  const errors: string[] = []
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, errors: ["Preset must be an object."] }
  }
  const raw = input as Record<string, unknown>
  const version = raw.schemaVersion
  if (version !== PRESET_SCHEMA_VERSION) errors.push("Unsupported preset schema version.")

  const id = typeof raw.id === "string" ? raw.id : ""
  const slug = typeof raw.slug === "string" ? raw.slug : ""
  if (!isPresetSlug(id)) errors.push("Invalid preset id.")
  if (!isPresetSlug(slug)) errors.push("Invalid preset slug.")

  const title = cleanLine(raw.title, 90)
  const description = cleanLine(raw.description, 400)
  const style = cleanLine(raw.style, 60)
  if (!title) errors.push("Title is required.")
  if (!description) errors.push("Description is required.")
  if (!style) errors.push("Style is required.")
  if (!isStudioCategory(raw.category)) errors.push("Category must be interior, exterior, or landscape.")

  const publishedAt = typeof raw.publishedAt === "string" && !Number.isNaN(Date.parse(raw.publishedAt))
    ? new Date(raw.publishedAt).toISOString()
    : ""
  if (!publishedAt) errors.push("publishedAt must be an ISO date.")

  if (errors.length || !isStudioCategory(raw.category)) {
    return { ok: false, errors }
  }

  const promptBrief = sanitizePresetBrief(raw.promptBrief) ?? ""
  const usageCount =
    typeof raw.usageCount === "number" && Number.isInteger(raw.usageCount) && raw.usageCount >= 0
      ? raw.usageCount
      : null

  const preset: DesignPreset = {
    schemaVersion: PRESET_SCHEMA_VERSION,
    id,
    slug,
    title,
    description,
    category: raw.category,
    style,
    materials: cleanList(raw.materials, 8, 40),
    features: cleanList(raw.features, 8, 40),
    promptBrief,
    controls: sanitizePresetControls(raw.category, raw.controls),
    referenceImage: referenceImage(raw.referenceImage),
    tags: cleanList(raw.tags, 8, 32),
    regions: cleanList(raw.regions, 6, 40),
    publishedAt,
    featured: raw.featured === true,
    isNew: raw.isNew === true,
    usageCount,
  }
  return { ok: true, preset }
}

const PUBLISHED = "2026-10-18T15:00:00.000Z"

function seed(preset: DesignPreset): DesignPreset {
  const checked = validateGalleryBotPreset(preset)
  if (!checked.ok) {
    throw new Error(`Invalid seed preset ${preset.slug}: ${checked.errors.join(" ")}`)
  }
  return checked.preset
}

/**
 * Regional starters. Reference photos are existing Renderspace concept renders.
 * Presets without a matching on-site asset have no image.
 */
export const GALLERY_PRESETS: readonly DesignPreset[] = [
  seed({
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: "texas-hill-country-limestone",
    slug: "texas-hill-country-limestone",
    title: "Texas Hill Country limestone",
    description:
      "A Hill Country landscape starting point: hilly ground, stone hardscape, and a design note for cream limestone, live oaks, and native grasses.",
    category: "landscape",
    style: "Hill Country",
    materials: ["Limestone", "Dry-stack stone", "Gravel"],
    features: ["Live oaks", "Native grasses", "Stone paths"],
    promptBrief:
      "Texas Hill Country: cream limestone boulders and low walls, live oaks, dry-stack stone, gravel paths, and native grasses.",
    controls: {
      gardenType: "Residential",
      lighting: "Daylight",
      timeOfDay: "afternoon",
      topography: "hilly",
      hardscaping: "stone",
      wallMaterials: "stone",
      plantTypes: "trees",
      plantingDensity: 50,
      climateZone: "arid",
      weather: "sunny",
      cameraAngle: "eye level",
      waterFeature: "none",
    },
    referenceImage: null,
    tags: ["limestone", "hill country", "native"],
    regions: ["Texas", "Hill Country"],
    publishedAt: PUBLISHED,
    featured: true,
    isNew: true,
    usageCount: null,
  }),
  seed({
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: "contemporary-dallas-outdoor-living",
    slug: "contemporary-dallas-outdoor-living",
    title: "Contemporary Dallas outdoor living",
    description:
      "A modern residential terrace for Dallas: pavers, a pergola, and outdoor seating, with a note for clean limestone and wood.",
    category: "landscape",
    style: "Contemporary",
    materials: ["Limestone", "Wood", "Pavers"],
    features: ["Pergola", "Outdoor seating", "Low plantings"],
    promptBrief:
      "Contemporary Dallas outdoor living: clean limestone and wood, low plantings, and a cedar pergola over a seating terrace.",
    controls: {
      gardenType: "Residential",
      lighting: "Daylight",
      timeOfDay: "afternoon",
      topography: "flat",
      hardscaping: "pavers",
      structures: "pergola",
      outdoorFurniture: "outdoor sofa",
      plantTypes: "shrubs",
      plantingDensity: 25,
      climateZone: "temperate",
      weather: "sunny",
      cameraAngle: "eye level",
      wallMaterials: "stone",
    },
    referenceImage: null,
    tags: ["dallas", "contemporary", "outdoor living"],
    regions: ["Dallas", "Texas"],
    publishedAt: PUBLISHED,
    featured: true,
    isNew: true,
    usageCount: null,
  }),
  seed({
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: "classical-dallas-landscape",
    slug: "classical-dallas-landscape",
    title: "Classical Dallas landscape",
    description:
      "A formal garden starting point: traditional style, stone hardscape, and a fountain. The photo is an existing Renderspace garden concept, used only as a style reference.",
    category: "landscape",
    style: "Classical",
    materials: ["Stone", "Clipped shrubs"],
    features: ["Fountain", "Formal layout", "Stone walls"],
    promptBrief:
      "Classical Dallas landscape: formal axis, clipped shrubs, a stone fountain, and symmetrical garden beds.",
    controls: {
      gardenType: "Residential",
      themeStyle: "formal",
      lighting: "Daylight",
      gardenGeometry: "rectangular",
      hardscaping: "stone",
      waterFeature: "fountain",
      wallMaterials: "stone",
      plantTypes: "shrubs",
      plantingDensity: 75,
      scale: "grand",
      topography: "flat",
      climateZone: "temperate",
      cameraAngle: "high angle",
    },
    referenceImage: {
      src: "/gallery/garden-tiered-fountain-hammock-deck-concept.jpg",
      alt: "Existing Renderspace garden concept with a tiered stone fountain, used as a style reference for a classical landscape.",
    },
    tags: ["classical", "fountain", "formal"],
    regions: ["Dallas", "Texas"],
    publishedAt: PUBLISHED,
    featured: true,
    isNew: true,
    usageCount: null,
  }),
  seed({
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: "cedar-pergola-outdoor-kitchen",
    slug: "cedar-pergola-outdoor-kitchen",
    title: "Cedar pergola and outdoor kitchen",
    description:
      "A wood deck and pergola starting point, with a design note for cedar structure and an outdoor kitchen. The photo is an existing Renderspace backyard concept.",
    category: "landscape",
    style: "Modern",
    materials: ["Cedar", "Wood deck"],
    features: ["Pergola", "Outdoor kitchen", "Dining"],
    promptBrief:
      "Cedar pergola over a wood deck with an outdoor kitchen, dining table, and raised planting beds.",
    controls: {
      gardenType: "Residential",
      lighting: "Daylight",
      timeOfDay: "afternoon",
      structures: "pergola",
      hardscaping: "wood deck",
      wallMaterials: "wood",
      outdoorFurniture: "dining set",
      plantTypes: "grasses",
      plantingDensity: 25,
      interactiveElements: "pathway",
      topography: "flat",
      climateZone: "temperate",
      cameraAngle: "eye level",
    },
    referenceImage: {
      src: "/gallery/backyard-deck-pergola-hammock-concept.jpg",
      alt: "Existing Renderspace backyard concept with a wood deck and pergola, used as a style reference.",
    },
    tags: ["cedar", "pergola", "outdoor kitchen"],
    regions: ["Texas"],
    publishedAt: PUBLISHED,
    featured: false,
    isNew: true,
    usageCount: null,
  }),
  seed({
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: "pool-hardscape-transformation",
    slug: "pool-hardscape-transformation",
    title: "Pool and hardscape transformation",
    description:
      "A swimming-pool starting point with paver hardscape and a pergola. No pool photograph is attached, because the gallery has no matching pool asset.",
    category: "landscape",
    style: "Modern",
    materials: ["Travertine", "Limestone coping", "Pavers"],
    features: ["Swimming pool", "Hardscape", "Pergola"],
    promptBrief:
      "Swimming pool with limestone coping, travertine hardscape, and a cedar pergola beside the water.",
    controls: {
      gardenType: "Residential",
      lighting: "Evening",
      timeOfDay: "evening",
      waterFeature: "pool",
      hardscaping: "pavers",
      structures: "pergola",
      outdoorFurniture: "outdoor sofa",
      topography: "flat",
      plantTypes: "shrubs",
      plantingDensity: 25,
      climateZone: "temperate",
      cameraAngle: "high angle",
    },
    referenceImage: null,
    tags: ["pool", "hardscape", "pergola"],
    regions: ["Texas"],
    publishedAt: PUBLISHED,
    featured: false,
    isNew: true,
    usageCount: null,
  }),
]

const BY_SLUG = new Map(GALLERY_PRESETS.map((preset) => [preset.slug, preset]))

export function resolveGalleryPreset(slug: string | null | undefined): DesignPreset | null {
  if (!isPresetSlug(slug)) return null
  return BY_SLUG.get(slug) ?? null
}

export function listGalleryPresets(): readonly DesignPreset[] {
  return GALLERY_PRESETS
}

export function studioPresetHref(
  preset: { category: StudioCategory; slug: string },
  options?: { demo?: boolean }
): string {
  const params = new URLSearchParams({ preset: preset.slug })
  if (options?.demo) params.set("demo", "true")
  return `/studio/${preset.category}?${params.toString()}`
}

/** Controls plus the editable brief. Unsupported values are already removed. */
export function presetStudioPatch(preset: DesignPreset): Record<string, string | number> {
  const patch: Record<string, string | number> = { ...preset.controls }
  if (preset.promptBrief) patch.presetBrief = preset.promptBrief
  return patch
}

export type PublishedPresetSource = {
  slug: string
  title: string
  description: string
  region: string | null
  tags: string[]
  publishedAt: string
  conceptKey: string | null
  renderType: StudioCategory | null
  details: { slot?: string; text?: string; short?: string }[]
}

function mentionsOption(text: string, option: string): boolean {
  const escaped = option.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text)
}

function inferControls(category: StudioCategory, text: string): Record<string, string | number> {
  const rules = CONTROL_RULES[category]
  const controls: Record<string, string | number> = {}
  for (const [key, rule] of Object.entries(rules)) {
    if (rule.kind !== "enum") continue
    const hit = rule.values.find((option) => option !== "none" && mentionsOption(text, option))
    if (hit) controls[key] = hit
  }
  return controls
}

/**
 * Build a preset from a published gallery job. Catalog presets win when concept_key or slug matches.
 * Detail text is matched only to Studio options; other wording stays in the editable brief.
 */
export function presetForPublishedRender(source: PublishedPresetSource): DesignPreset | null {
  const known = resolveGalleryPreset(source.conceptKey) ?? resolveGalleryPreset(source.slug)
  if (known) return known
  if (!source.renderType || !isPresetSlug(source.slug)) return null

  const detailText = source.details
    .map((detail) => cleanLine(detail.text || detail.short, 160))
    .filter(Boolean)
  const materials = source.details
    .filter((detail) => detail.slot === "materials" || detail.slot === "finishes")
    .map((detail) => cleanLine(detail.short || detail.text, 40))
    .filter(Boolean)
  const features = source.details
    .filter((detail) => detail.slot === "features" || detail.slot === "structure")
    .map((detail) => cleanLine(detail.short || detail.text, 40))
    .filter(Boolean)

  const publishedMs = Date.parse(source.publishedAt)
  const isNew = Number.isFinite(publishedMs) && Date.now() - publishedMs < 1000 * 60 * 60 * 24 * 30

  const draft = {
    schemaVersion: PRESET_SCHEMA_VERSION,
    id: source.slug,
    slug: source.slug,
    title: source.title,
    description: source.description,
    category: source.renderType,
    style: source.tags[0] || source.renderType,
    materials,
    features,
    promptBrief: detailText.join(". "),
    controls: inferControls(source.renderType, detailText.join(". ")),
    referenceImage: null,
    tags: source.tags,
    regions: source.region ? [source.region] : [],
    publishedAt: source.publishedAt,
    featured: false,
    isNew,
    usageCount: null,
  }
  const checked = validateGalleryBotPreset(draft)
  return checked.ok ? checked.preset : null
}

export function hasMeasuredPopularity(preset: DesignPreset): boolean {
  return typeof preset.usageCount === "number" && preset.usageCount > 0
}
