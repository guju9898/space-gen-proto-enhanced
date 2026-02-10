/**
 * TIERED PROMPT ASSEMBLY SYSTEM
 * 
 * This module implements a deterministic, weighted prompt assembly system
 * that uses Primary/Secondary/Advanced variable hierarchy to prevent conflicts
 * and produce stable, demo-safe prompts.
 */

import type { InteriorConfig, ExteriorConfig, LandscapeConfig } from "@/types/studio"

// Variable tier definitions for frontend/backend alignment
export const PROMPT_VARIABLE_TIERS = {
  interior: {
    primary: ["roomType", "designStyle"],
    secondary: ["colorPalette", "lighting", "timeOfDay", "cameraAngle", "focalPoint", "materials"],
    advanced: ["architect", "lens", "geometry", "symmetry", "mood", "typology", "roomLayout", "viewType", "compositionStyle", "framing", "negativeSpace", "patternsRepetition", "symmetryLevel", "flooring", "textures"]
  },
  exterior: {
    primary: ["buildingType", "architecturalStyle"],
    secondary: ["surroundingEnvironment", "timeOfDay", "colorPalette", "exteriorMaterials", "cameraAngle", "focalPoint"],
    advanced: ["style", "roofStyle", "lighting", "symmetryType", "symmetryLevel", "exteriorViews", "outdoorFurnishings", "exteriorAccents", "landscapingElements"]
  },
  landscape: {
    primary: ["landscapeType", "landscapeStyle"],
    secondary: ["colorPalette", "lighting", "cameraAngle", "hardscape", "plantingStyle", "primaryFeature"],
    advanced: ["gardenType", "themeStyle", "topography", "focalPoint", "plantTypes", "plantingDensity", "waterFeature", "seatingFeature", "structures", "decorativeElement", "playActivityArea", "interactiveElements", "outdoorFurniture", "wallMaterials", "wildlifeElements", "climateZone", "weather", "lightingIntensity", "scale", "geometry", "gardenGeometry", "atmosphere", "mood"]
  }
}

type StudioVariables = InteriorConfig | ExteriorConfig | LandscapeConfig

interface BuildPromptOptions {
  studioType: "interior" | "exterior" | "landscape"
  variables: StudioVariables
  realismLevel: number
  hasReferenceImage: boolean
}

/**
 * Helper: Check if a value exists and is meaningful
 */
function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string" && value.trim() === "") return false
  if (typeof value === "number" && isNaN(value)) return false
  return true
}

/**
 * Helper: Soften advanced variable language to prevent conflicts
 */
function softenAdvancedLanguage(text: string, hasStrongPrimary: boolean): string {
  if (!hasStrongPrimary) return text
  
  // Add qualifying language
  const qualifiers = ["gently", "subtly", "suggesting", "with subtle hints of", "influenced by"]
  const randomQualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)]
  
  // Don't double-qualify if already qualified
  if (text.includes("gently") || text.includes("subtly") || text.includes("suggesting")) {
    return text
  }
  
  return `${randomQualifier} ${text}`
}

/**
 * Helper: Format realism level as percentage
 */
function formatRealism(realism: number): string {
  if (isNaN(realism) || realism < 0 || realism > 100) return "50"
  return Math.round(realism).toString()
}

/**
 * Helper: Build materials string from multiple sources
 */
function buildMaterialsString(variables: any, studioType: string): string {
  const materials: string[] = []
  
  if (studioType === "interior") {
    if (hasValue(variables.flooring)) materials.push(variables.flooring)
    if (hasValue(variables.textures)) materials.push(variables.textures)
  } else if (studioType === "exterior") {
    if (hasValue(variables.exteriorMaterials)) materials.push(variables.exteriorMaterials)
    if (hasValue(variables.roofStyle)) materials.push(`${variables.roofStyle} roof`)
  }
  
  if (materials.length === 0) return "high-quality materials"
  return materials.join(", ")
}

/**
 * Helper: Build symmetry description
 */
function buildSymmetryDescription(variables: any): string {
  if (hasValue(variables.symmetryType)) {
    return variables.symmetryType
  }
  if (hasValue(variables.symmetryLevel)) {
    const level = typeof variables.symmetryLevel === "number" ? variables.symmetryLevel : parseInt(String(variables.symmetryLevel))
    if (level >= 75) return "symmetrical"
    if (level >= 50) return "balanced"
    if (level >= 25) return "asymmetrical"
    return "asymmetrical"
  }
  return "balanced"
}

/**
 * Main prompt builder function
 */
export function buildPrompt({
  studioType,
  variables,
  realismLevel,
  hasReferenceImage
}: BuildPromptOptions): string {
  if (studioType === "interior") {
    return buildInteriorPrompt(variables as InteriorConfig, realismLevel, hasReferenceImage)
  }
  if (studioType === "exterior") {
    return buildExteriorPrompt(variables as ExteriorConfig, realismLevel, hasReferenceImage)
  }
  if (studioType === "landscape") {
    return buildLandscapePrompt(variables as LandscapeConfig, realismLevel, hasReferenceImage)
  }
  
  throw new Error(`Unknown studio type: ${studioType}`)
}

/**
 * INTERIOR PROMPT TEMPLATE (Replicate)
 */
function buildInteriorPrompt(
  config: InteriorConfig,
  realismLevel: number,
  hasReferenceImage: boolean
): string {
  const parts: string[] = []
  
  // PRIMARY: Room Type + Design Style (always included)
  const roomType = hasValue(config.roomType) ? config.roomType : "interior space"
  const designStyle = hasValue(config.designStyle) ? config.designStyle : "contemporary"
  parts.push(`Photorealistic interior rendering of a ${roomType} designed in a ${designStyle} style.`)
  
  // SECONDARY: Composition & View
  const compositionParts: string[] = []
  if (hasValue(config.cameraAngle)) {
    compositionParts.push(`captured from a ${config.cameraAngle} perspective`)
  }
  if (hasValue(config.viewType)) {
    compositionParts.push(`with a ${config.viewType} view`)
  }
  if (compositionParts.length > 0) {
    parts.push(`Composition & View:\nThe scene is ${compositionParts.join(" ")} with a clear, spatially accurate composition.`)
  } else {
    parts.push(`Composition & View:\nThe scene is captured with a clear, spatially accurate composition.`)
  }
  
  // SECONDARY: Lighting
  if (hasValue(config.lighting)) {
    parts.push(`Lighting:\nUse ${config.lighting} lighting to define depth, shadows, and realism.`)
  } else {
    parts.push(`Lighting:\nUse natural lighting to define depth, shadows, and realism.`)
  }
  
  // SECONDARY: Design & Materials
  const designParts: string[] = []
  if (hasValue(config.colorPalette)) {
    designParts.push(`a ${config.colorPalette} palette`)
  }
  const materials = buildMaterialsString(config, "interior")
  designParts.push(`materials such as ${materials}`)
  
  if (hasValue(config.focalPoint)) {
    designParts.push(`with the main visual focus on ${config.focalPoint}`)
  }
  
  // Note: furnitureStyle may not exist in config, skip if missing
  
  if (designParts.length > 0) {
    parts.push(`Design & Materials:\nIncorporate ${designParts.join(", ")}.`)
  } else {
    parts.push(`Design & Materials:\nIncorporate high-quality materials with balanced composition.`)
  }
  
  // REFERENCE & REALISM (always included)
  const referenceText = hasReferenceImage
    ? "Use the provided reference image as a visual anchor for proportions, layout logic, and material realism."
    : "Maintain accurate proportions, layout logic, and material realism."
  parts.push(`Reference & Realism:\n${referenceText} Target approximately ${formatRealism(realismLevel)}% photographic realism.`)
  
  // ADVANCED: Refinement (subtle, never contradicts primary)
  const advancedParts: string[] = []
  const hasStrongPrimary = hasValue(config.designStyle)
  
  if (hasValue(config.architect)) {
    const architectText = softenAdvancedLanguage(`influences inspired by ${config.architect}`, hasStrongPrimary)
    advancedParts.push(`Gently reflect ${architectText} without changing the selected style.`)
  }
  
  if (hasValue((config as any).lens)) {
    advancedParts.push(`Lens behavior should resemble a ${(config as any).lens} lens.`)
  }
  
  if (hasValue((config as any).geometry)) {
    advancedParts.push(`Maintain ${(config as any).geometry} geometry`)
  }
  
  const symmetry = buildSymmetryDescription(config as any)
  if (symmetry !== "balanced" || hasValue((config as any).symmetryLevel)) {
    advancedParts.push(`and ${symmetry} symmetry where appropriate.`)
  }
  
  if (hasValue(config.mood)) {
    const moodText = softenAdvancedLanguage(config.mood, hasStrongPrimary)
    advancedParts.push(`The overall mood should feel ${moodText}, enhancing the space without stylization artifacts.`)
  }
  
  if (advancedParts.length > 0) {
    parts.push(`Advanced Refinement (Subtle):\n${advancedParts.join(" ")}`)
  }
  
  return parts.join("\n\n")
}

/**
 * EXTERIOR PROMPT TEMPLATE (Gemini)
 */
function buildExteriorPrompt(
  config: ExteriorConfig,
  realismLevel: number,
  hasReferenceImage: boolean
): string {
  const parts: string[] = []
  
  // PRIMARY: Building Type + Architectural Style (always included)
  const buildingType = hasValue(config.buildingType) 
    ? config.buildingType 
    : (hasValue((config as any).exteriorType) ? (config as any).exteriorType : "building")
  const architecturalStyle = hasValue(config.architecturalStyle) ? config.architecturalStyle : "contemporary"
  parts.push(`Photorealistic exterior rendering of a ${buildingType} designed in a ${architecturalStyle} architectural style.`)
  
  // SECONDARY: Composition & View
  const compositionParts: string[] = []
  if (hasValue(config.cameraAngle)) {
    compositionParts.push(`viewed from a ${config.cameraAngle} angle`)
  }
  if (hasValue((config as any).exteriorViews)) {
    compositionParts.push(`showing the ${(config as any).exteriorViews} view`)
  }
  if (compositionParts.length > 0) {
    parts.push(`Composition & View:\nThe building is ${compositionParts.join(" ")} with clear massing and proportions.`)
  } else {
    parts.push(`Composition & View:\nThe building is viewed with clear massing and proportions.`)
  }
  
  // SECONDARY: Context & Time
  const contextParts: string[] = []
  if (hasValue(config.surroundingEnvironment)) {
    contextParts.push(`a ${config.surroundingEnvironment} environment`)
  }
  if (hasValue(config.timeOfDay)) {
    contextParts.push(`during ${config.timeOfDay}`)
  }
  if (contextParts.length > 0) {
    parts.push(`Context & Time:\nThe scene is set in ${contextParts.join(" ")}.`)
  } else {
    parts.push(`Context & Time:\nThe scene is set in a natural environment.`)
  }
  
  // SECONDARY: Materials & Form
  const materialParts: string[] = []
  const materials = buildMaterialsString(config, "exterior")
  materialParts.push(`materials such as ${materials}`)
  
  if (hasValue(config.colorPalette)) {
    materialParts.push(`with a ${config.colorPalette} palette`)
  }
  
  if (hasValue((config as any).focalPoint)) {
    materialParts.push(`The main architectural focal feature is ${(config as any).focalPoint}`)
  }
  
  if (hasValue((config as any).landscapingElements)) {
    const landscapingPresence = (config as any).landscapingElements === "none" ? "minimal" : "site-appropriate"
    materialParts.push(`Landscaping should feel ${landscapingPresence} and site-appropriate.`)
  }
  
  if (materialParts.length > 0) {
    parts.push(`Materials & Form:\nUse ${materialParts.join(". ")}.`)
  } else {
    parts.push(`Materials & Form:\nUse high-quality materials with balanced composition.`)
  }
  
  // REFERENCE & REALISM (always included)
  const referenceText = hasReferenceImage
    ? "Use the provided reference image to guide proportions and façade detailing."
    : "Maintain accurate proportions and façade detailing."
  parts.push(`Reference & Realism:\n${referenceText} Target approximately ${formatRealism(realismLevel)}% photographic accuracy.`)
  
  // ADVANCED: Refinement (subtle, never contradicts primary)
  const advancedParts: string[] = []
  const hasStrongPrimary = hasValue(config.architecturalStyle)
  
  if (hasValue(config.style) && config.style !== config.architecturalStyle) {
    const styleText = softenAdvancedLanguage(`echo ${config.style}`, hasStrongPrimary)
    advancedParts.push(`Architectural influence may ${styleText}.`)
  }
  
  if (hasValue((config as any).lens)) {
    advancedParts.push(`Lens behavior should resemble a ${(config as any).lens} lens.`)
  }
  
  if (hasValue((config as any).geometry)) {
    advancedParts.push(`Respect ${(config as any).geometry} geometry`)
  }
  
  const symmetry = buildSymmetryDescription(config as any)
  if (symmetry !== "balanced" || hasValue((config as any).symmetryLevel)) {
    advancedParts.push(`and ${symmetry} symmetry as natural to the structure.`)
  }
  
  if (hasValue(config.lighting)) {
    const lightingText = softenAdvancedLanguage(config.lighting, hasStrongPrimary)
    advancedParts.push(`Atmospheric conditions should feel ${lightingText} without overpowering the architecture.`)
  }
  
  if (advancedParts.length > 0) {
    parts.push(`Advanced Refinement (Subtle):\n${advancedParts.join(" ")}`)
  }
  
  return parts.join("\n\n")
}

/**
 * LANDSCAPE PROMPT TEMPLATE (Gemini)
 */
function buildLandscapePrompt(
  config: LandscapeConfig,
  realismLevel: number,
  hasReferenceImage: boolean
): string {
  const parts: string[] = []
  
  // PRIMARY: Landscape Type + Style (always included)
  const landscapeType = hasValue((config as any).landscapeType) 
    ? (config as any).landscapeType 
    : (hasValue(config.gardenType) ? config.gardenType : "landscape")
  const landscapeStyle = hasValue(config.style) ? config.style : "contemporary"
  parts.push(`Photorealistic landscape design of a ${landscapeType} created in a ${landscapeStyle} style.`)
  
  // SECONDARY: Composition & View
  const compositionParts: string[] = []
  if (hasValue(config.cameraAngle)) {
    compositionParts.push(`viewed from a ${config.cameraAngle} perspective`)
  }
  if (hasValue((config as any).scale)) {
    compositionParts.push(`at ${(config as any).scale} scale`)
  }
  if (compositionParts.length > 0) {
    parts.push(`Composition & View:\nThe landscape is ${compositionParts.join(" ")} with clear spatial flow.`)
  } else {
    parts.push(`Composition & View:\nThe landscape is viewed with clear spatial flow.`)
  }
  
  // SECONDARY: Lighting
  if (hasValue(config.lighting)) {
    parts.push(`Lighting:\nUse ${config.lighting} lighting to create natural outdoor depth.`)
  } else {
    parts.push(`Lighting:\nUse natural lighting to create natural outdoor depth.`)
  }
  
  // SECONDARY: Design Elements
  const designParts: string[] = []
  if (hasValue((config as any).hardscaping)) {
    designParts.push((config as any).hardscaping)
  }
  
  const plantingStyle = hasValue((config as any).plantTypes) 
    ? (config as any).plantTypes 
    : (hasValue((config as any).plantingDensity) ? "balanced planting" : "natural planting")
  designParts.push(plantingStyle)
  
  if (hasValue(config.colorPalette)) {
    designParts.push(`a ${config.colorPalette} palette`)
  }
  
  const primaryFeature = hasValue((config as any).focalPoint)
    ? (config as any).focalPoint
    : (hasValue((config as any).waterFeature) ? (config as any).waterFeature : "natural elements")
  designParts.push(`with emphasis on ${primaryFeature}`)
  
  if (designParts.length > 0) {
    parts.push(`Design Elements:\nIncorporate ${designParts.join(" combined with ")}. The space should feel usable and grounded in real-world landscape logic.`)
  } else {
    parts.push(`Design Elements:\nIncorporate natural elements with balanced composition. The space should feel usable and grounded in real-world landscape logic.`)
  }
  
  // REFERENCE & REALISM (always included)
  const referenceText = hasReferenceImage
    ? "Use the provided reference image to guide scale, planting density, and materials."
    : "Maintain accurate scale, planting density, and materials."
  parts.push(`Reference & Realism:\n${referenceText} Target approximately ${formatRealism(realismLevel)}% photographic realism.`)
  
  // ADVANCED: Refinement (subtle, never contradicts primary)
  const advancedParts: string[] = []
  const hasStrongPrimary = hasValue(config.style)
  
  if (hasValue((config as any).geometry) || hasValue((config as any).gardenGeometry)) {
    const geometry = (config as any).gardenGeometry || (config as any).geometry
    advancedParts.push(`Maintain ${geometry} geometry`)
  }
  
  const symmetry = buildSymmetryDescription(config as any)
  if (symmetry !== "balanced") {
    advancedParts.push(`and ${symmetry} symmetry where appropriate.`)
  }
  
  if (hasValue((config as any).lens)) {
    advancedParts.push(`Lens behavior should resemble a ${(config as any).lens} lens.`)
  }
  
  if (hasValue((config as any).mood) || hasValue((config as any).atmosphere)) {
    const moodText = ((config as any).mood || (config as any).atmosphere || "")
    const softenedMood = softenAdvancedLanguage(moodText, hasStrongPrimary)
    advancedParts.push(`The atmosphere should feel ${softenedMood}, enhancing realism without stylization artifacts.`)
  }
  
  if (advancedParts.length > 0) {
    parts.push(`Advanced Refinement (Subtle):\n${advancedParts.join(" ")}`)
  }
  
  return parts.join("\n\n")
}

