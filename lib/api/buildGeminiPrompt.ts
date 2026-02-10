// Helper function to check if a value exists and is not empty
function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === "string" && value.trim() === "") return false
  if (typeof value === "number" && isNaN(value)) return false
  return true
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
function formatPercentage(value: number | undefined | null, label: string): string {
  if (!hasValue(value)) return ""
  const num = typeof value === "number" ? value : parseInt(String(value))
  if (isNaN(num)) return ""
  return `${label}: ${num}%`
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
    refinementParts.push(`Architectural influence may subtly echo ${advanced.architectInfluence} without changing the selected style.`)
  }
  
  // Lens
  if (hasValue(advanced.lens) && advanced.lens !== "standard") {
    refinementParts.push(`Lens behavior should resemble a ${advanced.lens} lens with natural depth and perspective.`)
  }
  
  // Geometry
  if (hasValue(advanced.geometry) && advanced.geometry !== "balanced") {
    refinementParts.push(`Overall form language should feel ${advanced.geometry} while remaining structurally realistic.`)
  }
  
  // Symmetry
  if (hasValue(advanced.symmetry) && advanced.symmetry !== "subtle") {
    refinementParts.push(`Composition may lean toward ${advanced.symmetry} symmetry where appropriate.`)
  }
  
  // Mood / Atmosphere
  if (hasValue(advanced.mood) && advanced.mood !== "neutral") {
    refinementParts.push(`Atmospheric conditions should feel ${advanced.mood} without overpowering the architecture.`)
  }
  
  if (refinementParts.length === 0) return ""
  
  return `Advanced Refinement (Subtle): ${refinementParts.join(" ")}`
}

// Helper function to build Advanced Refinement block for Landscape
function buildLandscapeAdvancedRefinement(advanced: any): string {
  if (!advanced || typeof advanced !== "object") return ""
  
  const refinementParts: string[] = []
  
  // Lens
  if (hasValue(advanced.lens) && advanced.lens !== "standard") {
    refinementParts.push(`Lens behavior should resemble a ${advanced.lens} lens without visual distortion.`)
  }
  
  // Geometry
  if (hasValue(advanced.geometry) && advanced.geometry !== "balanced") {
    refinementParts.push(`Spatial geometry should feel ${advanced.geometry} while maintaining natural outdoor flow.`)
  }
  
  // Symmetry
  if (hasValue(advanced.symmetry) && advanced.symmetry !== "subtle") {
    refinementParts.push(`Planting and layout may lean toward ${advanced.symmetry} symmetry where appropriate.`)
  }
  
  // Mood / Atmosphere
  if (hasValue(advanced.mood) && advanced.mood !== "neutral") {
    refinementParts.push(`The overall atmosphere should feel ${advanced.mood} while preserving realism.`)
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
  
  // Core clause: architecturalStyle, buildingType, surroundingEnvironment, timeOfDay
  const coreParts: string[] = []
  if (hasValue(config.architecturalStyle)) {
    coreParts.push(config.architecturalStyle)
  }
  if (hasValue(config.buildingType)) {
    coreParts.push(config.buildingType)
  } else if (hasValue(config.exteriorType)) {
    coreParts.push(config.exteriorType)
  }
  
  if (coreParts.length > 0) {
    let coreClause = `Create a photorealistic rendering of a ${coreParts.join(" ")}`
    if (hasValue(config.surroundingEnvironment)) {
      coreClause += `, situated in a ${config.surroundingEnvironment} setting`
    }
    if (hasValue(config.timeOfDay)) {
      coreClause += ` during ${config.timeOfDay}`
    }
    coreClause += "."
    clauses.push(coreClause)
  } else {
    clauses.push("Create a photorealistic rendering of a building.")
  }
  
  // Visual clause: style, colorPalette
  const visualParts: string[] = []
  if (hasValue(config.style)) {
    visualParts.push(`${config.style} aesthetic`)
  }
  if (hasValue(config.colorPalette)) {
    visualParts.push(`${config.colorPalette} color palette`)
  }
  if (visualParts.length > 0) {
    clauses.push(`Visual Style: ${visualParts.join(" with ")}.`)
  }
  
  // Composition clause: symmetryType, symmetryLevel, focalPoint, exteriorViews, cameraAngle
  const compositionParts: string[] = []
  if (hasValue(config.symmetryType)) {
    const symmetryDesc = config.symmetryType === "symmetrical" ? "symmetrical" : 
                         config.symmetryType === "asymmetrical" ? "asymmetrical" : 
                         config.symmetryType === "radial" ? "radial" : config.symmetryType
    compositionParts.push(`${symmetryDesc} layout`)
  }
  if (hasValue(config.symmetryLevel)) {
    compositionParts.push(formatPercentage(config.symmetryLevel, "symmetry level"))
  }
  if (hasValue(config.focalPoint)) {
    compositionParts.push(`focal point on ${config.focalPoint}`)
  }
  if (hasValue(config.exteriorViews)) {
    compositionParts.push(`viewed from ${config.exteriorViews} angle`)
  }
  if (hasValue(config.cameraAngle)) {
    compositionParts.push(`${config.cameraAngle} perspective`)
  }
  if (compositionParts.length > 0) {
    clauses.push(`Composition: ${compositionParts.join(", ")}.`)
  }
  
  // Materials clause: exteriorMaterials, roofStyle
  const materialParts: string[] = []
  if (hasValue(config.exteriorMaterials)) {
    materialParts.push(`${config.exteriorMaterials} exterior`)
  }
  if (hasValue(config.roofStyle)) {
    materialParts.push(`${config.roofStyle} roof`)
  }
  if (materialParts.length > 0) {
    clauses.push(`Materials: ${materialParts.join(", ")}.`)
  }
  
  // Lighting clause: lighting
  if (hasValue(config.lighting)) {
    clauses.push(`Lighting: ${config.lighting} lighting conditions.`)
  }
  
  // Details clause: outdoorFurnishings, exteriorAccents, landscapingElements
  const detailParts: string[] = []
  if (hasValue(config.outdoorFurnishings)) {
    detailParts.push(config.outdoorFurnishings)
  }
  if (hasValue(config.exteriorAccents)) {
    detailParts.push(config.exteriorAccents)
  }
  if (hasValue(config.landscapingElements)) {
    detailParts.push(config.landscapingElements)
  }
  if (detailParts.length > 0) {
    clauses.push(`Details: ${detailParts.join(", ")}.`)
  }
  
  // Realism clause
  if (hasValue(config.realism)) {
    const realismDesc = formatRealism(config.realism)
    if (realismDesc) {
      clauses.push(`Rendered with ${realismDesc}.`)
    }
  }
  
  // Technical suffix
  clauses.push("Professional architectural photography, 8k uhd, highly detailed, balanced composition, defined shadows, natural lighting, visual coherence.")
  
  // Reference image note
  if (config.image) {
    clauses.push("Adapt visual output based on uploaded reference image.")
  }
  
  // Advanced Refinement (appended last, only if non-neutral values exist)
  const advancedRefinement = buildExteriorAdvancedRefinement(config.advanced)
  if (advancedRefinement) {
    clauses.push(advancedRefinement)
  }
  
  return clauses.join(" ")
}

function buildLandscapePrompt(config: Record<string, any>): string {
  const clauses: string[] = []
  
  // Core clause: gardenType, style
  const coreParts: string[] = []
  if (hasValue(config.gardenType)) {
    coreParts.push(config.gardenType)
  } else if (hasValue(config.landscapeType)) {
    coreParts.push(config.landscapeType)
  }
  
  if (coreParts.length > 0) {
    let coreClause = `Design a realistic ${coreParts[0]} landscape`
    if (hasValue(config.themeStyle)) {
      coreClause += ` with ${config.themeStyle} theme`
    }
    if (hasValue(config.style)) {
      coreClause += ` using a ${config.style} aesthetic`
    }
    if (hasValue(config.topography)) {
      coreClause += ` on ${config.topography} terrain`
    }
    coreClause += "."
    clauses.push(coreClause)
  } else {
    clauses.push("Design a realistic landscape.")
  }
  
  // Visual clause: colorPalette, atmosphere
  const visualParts: string[] = []
  if (hasValue(config.colorPalette)) {
    visualParts.push(`${config.colorPalette} color palette`)
  }
  if (hasValue(config.atmosphere)) {
    visualParts.push(`${config.atmosphere} atmosphere`)
  }
  if (visualParts.length > 0) {
    clauses.push(`Visual Style: ${visualParts.join(", ")}.`)
  }
  
  // Composition clause: gardenGeometry, geometry, scale, cameraAngle
  const compositionParts: string[] = []
  if (hasValue(config.gardenGeometry)) {
    compositionParts.push(`${config.gardenGeometry} garden layout`)
  } else if (hasValue(config.geometry)) {
    compositionParts.push(`${config.geometry} layout`)
  }
  if (hasValue(config.scale)) {
    compositionParts.push(`${config.scale} scale`)
  }
  if (hasValue(config.cameraAngle)) {
    compositionParts.push(`${config.cameraAngle} perspective`)
  }
  if (hasValue(config.focalPoint)) {
    compositionParts.push(`focal point on ${config.focalPoint}`)
  }
  if (compositionParts.length > 0) {
    clauses.push(`Composition: ${compositionParts.join(", ")}.`)
  }
  
  // Planting clause: plantTypes, plantingDensity
  const plantingParts: string[] = []
  if (hasValue(config.plantTypes)) {
    plantingParts.push(config.plantTypes)
  }
  if (hasValue(config.plantingDensity)) {
    plantingParts.push(formatPercentage(config.plantingDensity, "planting density"))
  }
  if (plantingParts.length > 0) {
    clauses.push(`Planting: ${plantingParts.join(", ")}.`)
  }
  
  // Features clause: waterFeature, seatingFeature, structures, decorativeElement, playActivityArea, interactiveElements, outdoorFurniture, hardscaping, wallMaterials, wildlifeElements
  const featureParts: string[] = []
  if (hasValue(config.waterFeature)) {
    featureParts.push(config.waterFeature)
  }
  if (hasValue(config.seatingFeature)) {
    featureParts.push(config.seatingFeature)
  }
  if (hasValue(config.structures)) {
    featureParts.push(config.structures)
  }
  if (hasValue(config.decorativeElement)) {
    featureParts.push(config.decorativeElement)
  }
  if (hasValue(config.playActivityArea)) {
    featureParts.push(config.playActivityArea)
  }
  if (hasValue(config.interactiveElements)) {
    featureParts.push(config.interactiveElements)
  }
  if (hasValue(config.outdoorFurniture)) {
    featureParts.push(config.outdoorFurniture)
  }
  if (hasValue(config.hardscaping)) {
    featureParts.push(config.hardscaping)
  }
  if (hasValue(config.wallMaterials)) {
    featureParts.push(config.wallMaterials)
  }
  if (hasValue(config.wildlifeElements)) {
    featureParts.push(config.wildlifeElements)
  }
  if (featureParts.length > 0) {
    clauses.push(`Features: ${featureParts.join(", ")}.`)
  }
  
  // Environment clause: climateZone, weather, timeOfDay
  const envParts: string[] = []
  if (hasValue(config.climateZone)) {
    envParts.push(`${config.climateZone} climate`)
  }
  if (hasValue(config.weather)) {
    envParts.push(config.weather)
  }
  if (hasValue(config.timeOfDay)) {
    envParts.push(config.timeOfDay)
  }
  if (envParts.length > 0) {
    clauses.push(`Environment: ${envParts.join(", ")}.`)
  }
  
  // Lighting clause: lighting, lightingIntensity
  const lightingParts: string[] = []
  if (hasValue(config.lighting)) {
    lightingParts.push(config.lighting)
  }
  if (hasValue(config.lightingIntensity)) {
    lightingParts.push(formatPercentage(config.lightingIntensity, "lighting intensity"))
  }
  if (lightingParts.length > 0) {
    clauses.push(`Lighting: ${lightingParts.join(", ")}.`)
  }
  
  // Realism clause
  if (hasValue(config.realism)) {
    const realismDesc = formatRealism(config.realism)
    if (realismDesc) {
      clauses.push(`Rendered with ${realismDesc}.`)
    }
  }
  
  // Technical suffix
  clauses.push("Professional landscape photography, 8k uhd, highly detailed, emphasis on usability, emotional ambiance, realism in vegetation layout and shading, visual coherence.")
  
  // Reference image note
  if (config.image) {
    clauses.push("Adapt visual output based on uploaded reference image.")
  }
  
  // Advanced Refinement (appended last, only if non-neutral values exist)
  const advancedRefinement = buildLandscapeAdvancedRefinement(config.advanced)
  if (advancedRefinement) {
    clauses.push(advancedRefinement)
  }
  
  return clauses.join(" ")
}
