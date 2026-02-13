import { InteriorConfig, ExteriorConfig, LandscapeConfig, ProductConfig, AdvancedConfig } from "@/types/studio"

export const interiorDefaults: InteriorConfig = {
  roomType: "living",
  designStyle: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  timeOfDay: "day",
  mood: "calm",
  architect: "foster",
  lens: "wide",
  typology: "open",
  geometry: "rectangular",
  realism: 50,
  image: null
}

const landscapeAdvancedDefaults: AdvancedConfig = {
  architectInfluence: "none",
  lens: "standard",
  geometry: "balanced",
  symmetry: "subtle",
  mood: "neutral"
}

export const landscapeDefaults: LandscapeConfig = {
  gardenType: "Residential",
  style: "modern",
  colorPalette: "neutral",
  lighting: "Daylight",
  image: null,
  realism: 50,
  advanced: landscapeAdvancedDefaults
}

const exteriorAdvancedDefaults: AdvancedConfig = {
  architectInfluence: "none",
  lens: "standard",
  geometry: "balanced",
  symmetry: "subtle",
  mood: "neutral"
}

export const exteriorDefaults: ExteriorConfig = {
  buildingType: "house",
  architecturalStyle: "modern",
  surroundingEnvironment: "urban",
  timeOfDay: "day",
  style: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  image: null,
  realism: 50,
  advanced: exteriorAdvancedDefaults
}

export const productDefaults: ProductConfig = {
  productType: "furniture",
  style: "modern",
  colorPalette: "neutral",
  material: "wood",
  image: null,
  realism: 50
}

