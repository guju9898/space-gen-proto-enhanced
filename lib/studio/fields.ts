import type { StudioKind } from "@/lib/studio/lastStudio"

/**
 * Studio v2 field guide (spec section E): contractor wording, one line of help with
 * an example, and how each control behaves. Matched on the control's current label
 * (or placeholder for the unlabeled advanced selects), so the Studio pages keep
 * working unchanged when v2 is off. Nothing here changes what is sent to the prompt
 * except multi-value fields, which store "a, b" in the same string field.
 */
export type FieldLevel = { label: string; value: string }

export type FieldMeta = {
  key: string
  /** Label shown in v2. */
  label: string
  /** One line under the label, with an example. */
  hint?: string
  /** Several picks stored as "a, b, c" (still one string). */
  multi?: boolean
  /** Named levels shown as buttons instead of 0-100 numbers. Values keep the same numbers. */
  levels?: FieldLevel[]
  /** Camera/composition control: hidden in photo mode until "Show camera & composition" is on. */
  camera?: boolean
  /** Covered by another field in v2 (still sent if already set). */
  hiddenInV2?: boolean
}

type Entry = FieldMeta & { studio: StudioKind; match: string }

const DENSITY: FieldLevel[] = [
  { label: "Sparse", value: "25" },
  { label: "Balanced", value: "50" },
  { label: "Lush", value: "100" },
]
const INTENSITY: FieldLevel[] = [
  { label: "Subtle", value: "25" },
  { label: "Moderate", value: "50" },
  { label: "Bright", value: "100" },
]
const SYMMETRY: FieldLevel[] = [
  { label: "Relaxed", value: "25" },
  { label: "Balanced", value: "50" },
  { label: "Formal", value: "100" },
]

const ENTRIES: Entry[] = [
  // Landscape
  { studio: "landscape", match: "Garden Type", key: "gardenType", label: "Property type", hint: "Pick one or type it, e.g. HOA entrance, ranch backyard." },
  { studio: "landscape", match: "Theme Style", key: "themeStyle", label: "Style", hint: "e.g. Texas Hill Country, modern farmhouse, coastal, desert modern." },
  { studio: "landscape", match: "Lighting", key: "lighting", label: "Light", hint: "e.g. bright midday sun, soft overcast." },
  { studio: "landscape", match: "Time of Day", key: "timeOfDay", label: "Time of day", hint: "Dusk shows landscape lighting best." },
  { studio: "landscape", match: "Hardscaping", key: "hardscaping", label: "Paving and decking", multi: true, hint: "Add several, e.g. travertine pavers, stamped concrete border." },
  { studio: "landscape", match: "Water Feature", key: "waterFeature", label: "Pool and water", multi: true, hint: "e.g. freeform pool with tanning ledge, raised spa, sheer descent." },
  { studio: "landscape", match: "Plant Types", key: "plantTypes", label: "Plants", multi: true, hint: "Name species, e.g. live oak, Mexican feather grass, agave." },
  { studio: "landscape", match: "Planting Density", key: "plantingDensity", label: "How full the planting is", levels: DENSITY },
  { studio: "landscape", match: "Topography", key: "topography", label: "Grade", hint: "Leave as is to keep the yard's grade, or add terraces or a retaining wall." },
  { studio: "landscape", match: "Outdoor Furniture", key: "outdoorFurniture", label: "Furniture and seating", multi: true, hint: "e.g. teak dining set for six, built-in bench, fire pit chairs." },
  { studio: "landscape", match: "Seating Feature", key: "seatingFeature", label: "Seating feature", hiddenInV2: true },
  { studio: "landscape", match: "Structures", key: "structures", label: "Structures", multi: true, hint: "e.g. cedar pergola, pavilion, shade sail, pool house." },
  { studio: "landscape", match: "Lighting Intensity", key: "lightingIntensity", label: "Landscape lights", levels: INTENSITY, hint: "Most visible at dusk or night." },
  { studio: "landscape", match: "Play Activity Area", key: "playActivityArea", label: "Play and sport", hint: "e.g. putting green, pickleball court, playset." },
  { studio: "landscape", match: "Interactive Elements", key: "interactiveElements", label: "Paths and crossings", multi: true, hint: "e.g. flagstone stepping path, small footbridge." },
  { studio: "landscape", match: "Wall Materials", key: "wallMaterials", label: "Walls and fences", multi: true, hint: "e.g. limestone seat wall, horizontal cedar fence." },
  { studio: "landscape", match: "Climate Zone", key: "climateZone", label: "Region and climate", hint: "Sets believable plants, e.g. Central Texas, Southwest desert, Florida." },
  { studio: "landscape", match: "Weather", key: "weather", label: "Weather" },
  { studio: "landscape", match: "Scale", key: "scale", label: "Scale", camera: true },
  { studio: "landscape", match: "Geometry", key: "geometry", label: "Geometry", hiddenInV2: true },
  { studio: "landscape", match: "Garden Geometry", key: "gardenGeometry", label: "Layout shapes", hint: "Straight lines, curves or a mix, e.g. curved beds with a straight path." },
  { studio: "landscape", match: "Camera Angle", key: "cameraAngle", label: "Camera angle", camera: true },
  { studio: "landscape", match: "Wildlife Elements", key: "wildlifeElements", label: "Wildlife" },
  { studio: "landscape", match: "Select or type architect influence", key: "advanced.architectInfluence", label: "Architect influence", camera: true },
  { studio: "landscape", match: "Select lens", key: "advanced.lens", label: "Lens", camera: true },
  { studio: "landscape", match: "Select or type geometry", key: "advanced.geometry", label: "Form language", camera: true },
  { studio: "landscape", match: "Select or type symmetry", key: "advanced.symmetry", label: "Symmetry", camera: true },
  { studio: "landscape", match: "Select or type mood", key: "advanced.mood", label: "Mood" },

  // Exterior
  { studio: "exterior", match: "Exterior Type", key: "exteriorType", label: "Building type", hint: "Pick one or type it, e.g. two-story farmhouse, ranch home." },
  { studio: "exterior", match: "Architectural Style", key: "architecturalStyle", label: "Architectural style", hint: "Type the look you want, e.g. modern farmhouse, Texas Hill Country." },
  { studio: "exterior", match: "Surrounding Environment", key: "surroundingEnvironment", label: "Setting", camera: true },
  { studio: "exterior", match: "Color Palette", key: "colorPalette", label: "Colours", hint: "Name real colours, e.g. white siding with black trim." },
  { studio: "exterior", match: "Lighting", key: "lighting", label: "Light" },
  { studio: "exterior", match: "Time of Day", key: "timeOfDay", label: "Time of day" },
  { studio: "exterior", match: "Exterior Materials", key: "exteriorMaterials", label: "Siding and cladding", multi: true, hint: "e.g. board and batten, fiber cement, limestone wainscot." },
  { studio: "exterior", match: "Roof Style", key: "roofStyle", label: "Roof", hint: "e.g. standing-seam metal, charcoal architectural shingles." },
  { studio: "exterior", match: "Outdoor Furnishings", key: "outdoorFurnishings", label: "Porch and patio furniture", multi: true },
  { studio: "exterior", match: "Exterior Accents", key: "exteriorAccents", label: "Trim and accents", multi: true, hint: "e.g. black shutters, cedar corbels, copper lanterns." },
  { studio: "exterior", match: "Exterior Views", key: "exteriorViews", label: "View of the house", camera: true },
  { studio: "exterior", match: "Focal Point", key: "focalPoint", label: "Focal point", camera: true },
  { studio: "exterior", match: "Symmetry Type", key: "symmetryType", label: "Symmetry", camera: true },
  { studio: "exterior", match: "Symmetry Level", key: "symmetryLevel", label: "How formal", levels: SYMMETRY, camera: true },
  { studio: "exterior", match: "Landscaping Elements", key: "landscapingElements", label: "Front landscaping", multi: true, hint: "e.g. boxwood hedge, crape myrtles, flagstone walk." },
  { studio: "exterior", match: "Select or type architect influence", key: "advanced.architectInfluence", label: "Architect influence", camera: true },
  { studio: "exterior", match: "Select lens", key: "advanced.lens", label: "Lens", camera: true },
  { studio: "exterior", match: "Select or type geometry", key: "advanced.geometry", label: "Form language", camera: true },
  { studio: "exterior", match: "Select or type symmetry", key: "advanced.symmetry", label: "Symmetry", camera: true },
  { studio: "exterior", match: "Select or type mood", key: "advanced.mood", label: "Mood" },

  // Interior (always photo mode: a room photo is required)
  { studio: "interior", match: "Room Type", key: "roomType", label: "Room", hint: "Pick one or type it, e.g. mudroom, primary bath." },
  { studio: "interior", match: "Design Style", key: "designStyle", label: "Style", hint: "e.g. warm modern, transitional, Japandi." },
  { studio: "interior", match: "Typology", key: "typology", label: "Floor plan", camera: true },
  { studio: "interior", match: "Lens", key: "lens", label: "Lens", camera: true },
  { studio: "interior", match: "Room Layout", key: "roomLayout", label: "Room layout", camera: true },
  { studio: "interior", match: "Camera Angle", key: "cameraAngle", label: "Camera angle", camera: true },
  { studio: "interior", match: "View Type", key: "viewType", label: "View", camera: true },
  { studio: "interior", match: "Composition Style", key: "compositionStyle", label: "Composition", camera: true },
  { studio: "interior", match: "Focal Point", key: "focalPoint", label: "Focal point", camera: true },
  { studio: "interior", match: "Framing", key: "framing", label: "Framing", camera: true },
  { studio: "interior", match: "Negative Space", key: "negativeSpace", label: "Negative space", camera: true },
  { studio: "interior", match: "Patterns & Repetition", key: "patternsRepetition", label: "Patterns", camera: true },
  { studio: "interior", match: "Symmetry Level", key: "symmetryLevel", label: "How formal", levels: SYMMETRY, camera: true },
  { studio: "interior", match: "Material Focus", key: "flooring", label: "Flooring", hint: "e.g. white oak LVP, large-format porcelain tile." },
  { studio: "interior", match: "Textures", key: "textures", label: "Textures", multi: true },
  { studio: "interior", match: "Color Palette", key: "colorPalette", label: "Colours", hint: "e.g. warm white walls, navy cabinets, brass hardware." },
  { studio: "interior", match: "Lighting Type", key: "lighting", label: "Light" },
  { studio: "interior", match: "Time of Day", key: "timeOfDay", label: "Time of day" },
  { studio: "interior", match: "Mood / Atmosphere", key: "mood", label: "Mood" },
  { studio: "interior", match: "Architect", key: "architect", label: "Architect influence", camera: true },
  { studio: "interior", match: "Geometry", key: "geometry", label: "Geometry", camera: true },
]

/** For tests: every entry, to check each one matches a real control. */
export const FIELD_ENTRIES: readonly Entry[] = ENTRIES

export function fieldMeta(studio: StudioKind | null, match: string | undefined): FieldMeta | null {
  if (!studio || !match) return null
  return ENTRIES.find((e) => e.studio === studio && e.match === match) ?? null
}

/** Label for a config key (request summary chips). Falls back to a readable key. */
export function labelForKey(studio: StudioKind | null, key: string): string {
  const entry = studio ? ENTRIES.find((e) => e.studio === studio && e.key === key) : undefined
  if (entry) return entry.label
  if (key === "presetBrief") return "Design notes"
  if (key === "style") return "Style"
  if (key === "buildingType") return "Building type"
  return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())
}

/** "a, b" → ["a", "b"] for multi-value fields. */
export function splitMulti(value: string | null | undefined): string[] {
  if (!value) return []
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part && part.toLowerCase() !== "none")
}

export function joinMulti(values: string[]): string {
  const seen = new Set<string>()
  return values
    .map((v) => v.trim())
    .filter((v) => {
      const k = v.toLowerCase()
      if (!v || seen.has(k)) return false
      seen.add(k)
      return true
    })
    .join(", ")
}
