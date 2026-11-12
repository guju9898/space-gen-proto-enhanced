import { sanitizePresetBrief } from "@/lib/gallery/preset-brief"

// Helper function to check if a value exists and is not empty
function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string" && value.trim() === "") return false
  if (typeof value === "number" && isNaN(value)) return false
  return true
}

/**
 * A user value ready for the prompt: trimmed, single line, capped at 200 characters.
 * Returns "" for empty values and for "none", so "none" never reaches the model.
 * Custom strings typed in the Studio pass through unchanged otherwise.
 */
function v(raw: any): string {
  if (typeof raw === "number" && !isNaN(raw)) return String(raw)
  if (typeof raw !== "string") return ""
  const cleaned = raw.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()
  if (!cleaned || cleaned.toLowerCase() === "none") return ""
  return cleaned.length > 200 ? cleaned.slice(0, 197).trimEnd() + "..." : cleaned
}

/** Free-text notes (Public API instruction). Longer cap than a single field. */
function notesClause(raw: any): string {
  if (typeof raw !== "string") return ""
  const cleaned = raw.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()
  if (!cleaned) return ""
  return `Additional details: ${cleaned.length > 500 ? cleaned.slice(0, 497).trimEnd() + "..." : cleaned}`
}

function sanitizeDescriptor(raw: any): string {
  if (typeof raw !== "string") return ""
  const cleaned = raw.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()
  return cleaned.length > 120 ? cleaned.slice(0, 117).trimEnd() + "..." : cleaned
}

// Helper function to convert numeric realism to descriptive text
function formatRealism(realism: number | undefined | null): string {
  if (!hasValue(realism)) return ""
  const level = typeof realism === "number" ? realism : parseInt(String(realism))
  if (isNaN(level)) return ""
  
  if (level <= 25) return "stylized, artistic interpretation"
  if (level <= 50) return "semi-realistic, balanced"
  if (level <= 75) return "photorealistic, highly detailed"
  return "ultra-photorealistic, indistinguishable from photography"
}

// Helper function to format numeric percentage
function formatPercentage(value: number | string | undefined | null, label: string): string {
  if (!hasValue(value)) return ""
  // Numbers (and "75") read as a percentage; typed words ("lush", "very sparse") pass through.
  if (typeof value === "number" || /^\s*\d+(\.\d+)?\s*%?\s*$/.test(String(value))) {
    const num = typeof value === "number" ? value : parseFloat(String(value))
    if (isNaN(num)) return ""
    return `${label}: ${num}%`
  }
  const text = v(value)
  return text ? `${label}: ${text}` : ""
}

// Helper function to build a clause from multiple values
function buildClause(values: (string | undefined | null)[], separator: string = ", "): string {
  const validValues = values.filter(v => hasValue(v) && String(v).trim() !== "none")
  if (validValues.length === 0) return ""
  return validValues.map(v => String(v).trim()).join(separator)
}

// Helper function to build Advanced Refinement block for Exterior
function buildExteriorAdvancedRefinement(advanced: any): string {
  if (!advanced || typeof advanced !== "object") return ""
  
  const refinementParts: string[] = []
  
  // Architect Influence
  if (hasValue(advanced.architectInfluence) && advanced.architectInfluence !== "none") {
    const v = sanitizeDescriptor(advanced.architectInfluence)
    if (v) {
      refinementParts.push(`Architectural influence may subtly echo ${v} without changing the selected style.`)
    }
  }
  
  // Lens
  if (hasValue(advanced.lens) && advanced.lens !== "standard") {
    const v = sanitizeDescriptor(advanced.lens)
    if (v) {
      refinementParts.push(`Lens behavior should resemble a ${v} lens with natural depth and perspective.`)
    }
  }
  
  // Geometry
  if (hasValue(advanced.geometry) && advanced.geometry !== "balanced") {
    const v = sanitizeDescriptor(advanced.geometry)
    if (v) {
      refinementParts.push(`Overall form language should feel ${v} while remaining structurally realistic.`)
    }
  }
  
  // Symmetry
  if (hasValue(advanced.symmetry) && advanced.symmetry !== "subtle") {
    const v = sanitizeDescriptor(advanced.symmetry)
    if (v) {
      refinementParts.push(`Composition may lean toward ${v} symmetry where appropriate.`)
    }
  }
  
  // Mood / Atmosphere
  if (hasValue(advanced.mood) && advanced.mood !== "neutral") {
    const v = sanitizeDescriptor(advanced.mood)
    if (v) {
      refinementParts.push(`Atmospheric conditions should feel ${v} without overpowering the architecture.`)
    }
  }
  
  if (refinementParts.length === 0) return ""
  
  return `Advanced Refinement (Subtle): ${refinementParts.join(" ")}`
}

// Helper function to build Advanced Refinement block for Landscape
function buildLandscapeAdvancedRefinement(advanced: any): string {
  if (!advanced || typeof advanced !== "object") return ""
  
  const refinementParts: string[] = []
  
  if (hasValue(advanced.architectInfluence) && advanced.architectInfluence !== "none") {
    const v = sanitizeDescriptor(advanced.architectInfluence)
    if (v) {
      refinementParts.push(`Design language may subtly echo ${v} while staying a believable residential landscape.`)
    }
  }
  
  // Lens
  if (hasValue(advanced.lens) && advanced.lens !== "standard") {
    const v = sanitizeDescriptor(advanced.lens)
    if (v) {
      refinementParts.push(`Lens behavior should resemble a ${v} lens without visual distortion.`)
    }
  }
  
  // Geometry
  if (hasValue(advanced.geometry) && advanced.geometry !== "balanced") {
    const v = sanitizeDescriptor(advanced.geometry)
    if (v) {
      refinementParts.push(`Spatial geometry should feel ${v} while maintaining natural outdoor flow.`)
    }
  }
  
  // Symmetry
  if (hasValue(advanced.symmetry) && advanced.symmetry !== "subtle") {
    const v = sanitizeDescriptor(advanced.symmetry)
    if (v) {
      refinementParts.push(`Planting and layout may lean toward ${v} symmetry where appropriate.`)
    }
  }
  
  // Mood / Atmosphere
  if (hasValue(advanced.mood) && advanced.mood !== "neutral") {
    const v = sanitizeDescriptor(advanced.mood)
    if (v) {
      refinementParts.push(`The overall atmosphere should feel ${v} while preserving realism.`)
    }
  }
  
  if (refinementParts.length === 0) return ""
  
  return `Advanced Refinement (Subtle): ${refinementParts.join(" ")}`
}

export function buildGeminiPrompt(config: Record<string, any>): string {
  if (config.renderType === "exterior") {
    return buildExteriorPrompt(config)
  }
  if (config.renderType === "landscape") {
    return buildLandscapePrompt(config)
  }
  return "Create a beautiful architectural rendering. Adapt visual output based on realism tuning, mood preferences, and uploaded reference image if available."
}

function buildExteriorPrompt(config: Record<string, any>): string {
  const clauses: string[] = []

  // Core: style + building. The Studio's "Exterior Type" (exteriorType) wins over the
  // default buildingType, so a typed type such as "two-story farmhouse" is used.
  const architecturalStyle = v(config.architecturalStyle)
  const building = v(config.exteriorType) || v(config.buildingType)
  const coreParts = [architecturalStyle, building].filter(Boolean)
  if (coreParts.length > 0) {
    let coreClause = `Create a photorealistic rendering of a ${coreParts.join(" ")}`
    const environment = v(config.surroundingEnvironment)
    if (environment) coreClause += `, situated in a ${environment} setting`
    const timeOfDay = v(config.timeOfDay)
    if (timeOfDay) coreClause += ` during ${timeOfDay}`
    clauses.push(coreClause + ".")
  } else {
    clauses.push("Create a photorealistic rendering of a building.")
  }

  // Visual style. The generic "style" default only applies when no architectural style was chosen.
  const visualParts: string[] = []
  const style = architecturalStyle ? "" : v(config.style)
  if (style) visualParts.push(`${style} aesthetic`)
  const palette = v(config.colorPalette)
  if (palette) visualParts.push(`${palette} color palette`)
  if (visualParts.length > 0) clauses.push(`Visual Style: ${visualParts.join(" with ")}.`)

  const compositionParts: string[] = []
  const symmetryType = v(config.symmetryType)
  if (symmetryType) compositionParts.push(`${symmetryType} layout`)
  if (hasValue(config.symmetryLevel)) compositionParts.push(formatPercentage(config.symmetryLevel, "symmetry level"))
  const focalPoint = v(config.focalPoint)
  if (focalPoint) compositionParts.push(`focal point on ${focalPoint}`)
  const views = v(config.exteriorViews)
  if (views) compositionParts.push(`viewed from ${views} angle`)
  const cameraAngle = v(config.cameraAngle)
  if (cameraAngle) compositionParts.push(`${cameraAngle} perspective`)
  const composition = compositionParts.filter(Boolean)
  if (composition.length > 0) clauses.push(`Composition: ${composition.join(", ")}.`)

  const materialParts: string[] = []
  const materials = v(config.exteriorMaterials)
  if (materials) materialParts.push(`${materials} exterior`)
  const roof = v(config.roofStyle)
  if (roof) materialParts.push(`${roof} roof`)
  if (materialParts.length > 0) clauses.push(`Materials: ${materialParts.join(", ")}.`)

  const lighting = v(config.lighting)
  if (lighting) clauses.push(`Lighting: ${lighting} lighting conditions.`)

  const detailParts = [v(config.outdoorFurnishings), v(config.exteriorAccents), v(config.landscapingElements)].filter(Boolean)
  if (detailParts.length > 0) clauses.push(`Details: ${detailParts.join(", ")}.`)

  if (hasValue(config.realism)) {
    const realismDesc = formatRealism(config.realism)
    if (realismDesc) clauses.push(`Rendered with ${realismDesc}.`)
  }

  const exteriorBrief = sanitizePresetBrief(config.presetBrief)
  if (exteriorBrief) clauses.push(`Design direction: ${exteriorBrief}`)
  const notes = notesClause(config.notes)
  if (notes) clauses.push(notes)

  clauses.push("Professional architectural photography, 8k uhd, highly detailed, balanced composition, defined shadows, natural lighting, visual coherence.")

  if (config.image) clauses.push("Adapt visual output based on uploaded reference image.")

  const advancedRefinement = buildExteriorAdvancedRefinement(config.advanced)
  if (advancedRefinement) clauses.push(advancedRefinement)

  return clauses.join(" ")
}

function buildLandscapePrompt(config: Record<string, any>): string {
  const clauses: string[] = []

  // Core: garden type + theme. The Studio's "Theme Style" (themeStyle) replaces the
  // default "style", so a typed theme is not contradicted by "modern".
  const gardenType = v(config.gardenType) || v(config.landscapeType)
  if (gardenType) {
    let coreClause = `Design a realistic ${gardenType} landscape`
    const theme = v(config.themeStyle)
    const style = theme ? "" : v(config.style)
    if (theme) coreClause += ` with ${theme} theme`
    if (style) coreClause += ` using a ${style} aesthetic`
    const topography = v(config.topography)
    if (topography) coreClause += ` on ${topography} terrain`
    clauses.push(coreClause + ".")
  } else {
    clauses.push("Design a realistic landscape.")
  }

  const visualParts: string[] = []
  const palette = v(config.colorPalette)
  if (palette) visualParts.push(`${palette} color palette`)
  const atmosphere = v(config.atmosphere)
  if (atmosphere) visualParts.push(`${atmosphere} atmosphere`)
  if (visualParts.length > 0) clauses.push(`Visual Style: ${visualParts.join(", ")}.`)

  // Both geometry fields are used when both are set (they are separate controls).
  const compositionParts: string[] = []
  const gardenGeometry = v(config.gardenGeometry)
  const geometry = v(config.geometry)
  if (gardenGeometry) compositionParts.push(`${gardenGeometry} garden layout`)
  if (geometry && geometry !== gardenGeometry) compositionParts.push(`${geometry} layout`)
  const scale = v(config.scale)
  if (scale) compositionParts.push(`${scale} scale`)
  const cameraAngle = v(config.cameraAngle)
  if (cameraAngle) compositionParts.push(`${cameraAngle} perspective`)
  const focalPoint = v(config.focalPoint)
  if (focalPoint) compositionParts.push(`focal point on ${focalPoint}`)
  if (compositionParts.length > 0) clauses.push(`Composition: ${compositionParts.join(", ")}.`)

  const plantingParts: string[] = []
  const plants = v(config.plantTypes)
  if (plants) plantingParts.push(plants)
  if (hasValue(config.plantingDensity)) plantingParts.push(formatPercentage(config.plantingDensity, "planting density"))
  const planting = plantingParts.filter(Boolean)
  if (planting.length > 0) clauses.push(`Planting: ${planting.join(", ")}.`)

  const featureParts = [
    v(config.waterFeature),
    v(config.seatingFeature),
    v(config.structures),
    v(config.decorativeElement),
    v(config.playActivityArea),
    v(config.interactiveElements),
    v(config.outdoorFurniture),
    v(config.hardscaping),
    v(config.wallMaterials),
    v(config.wildlifeElements),
  ].filter(Boolean)
  const uniqueFeatures = featureParts.filter((part, idx) => featureParts.indexOf(part) === idx)
  if (uniqueFeatures.length > 0) clauses.push(`Features: ${uniqueFeatures.join(", ")}.`)

  const envParts: string[] = []
  const climate = v(config.climateZone)
  if (climate) envParts.push(`${climate} climate`)
  const weather = v(config.weather)
  if (weather) envParts.push(weather)
  const timeOfDay = v(config.timeOfDay)
  if (timeOfDay) envParts.push(timeOfDay)
  if (envParts.length > 0) clauses.push(`Environment: ${envParts.join(", ")}.`)

  const lightingParts: string[] = []
  const lighting = v(config.lighting)
  if (lighting) lightingParts.push(lighting)
  if (hasValue(config.lightingIntensity)) lightingParts.push(formatPercentage(config.lightingIntensity, "lighting intensity"))
  const lightingClause = lightingParts.filter(Boolean)
  if (lightingClause.length > 0) clauses.push(`Lighting: ${lightingClause.join(", ")}.`)

  if (hasValue(config.realism)) {
    const realismDesc = formatRealism(config.realism)
    if (realismDesc) clauses.push(`Rendered with ${realismDesc}.`)
  }

  const landscapeBrief = sanitizePresetBrief(config.presetBrief)
  if (landscapeBrief) clauses.push(`Design direction: ${landscapeBrief}`)
  const notes = notesClause(config.notes)
  if (notes) clauses.push(notes)

  clauses.push("Professional landscape photography, 8k uhd, highly detailed, emphasis on usability, emotional ambiance, realism in vegetation layout and shading, visual coherence.")

  if (config.image) clauses.push("Adapt visual output based on uploaded reference image.")

  // Advanced Refinement (appended last, only if non-neutral values exist)
  const advancedRefinement = buildLandscapeAdvancedRefinement(config.advanced)
  if (advancedRefinement) {
    clauses.push(advancedRefinement)
  }
  
  return clauses.join(" ")
}
