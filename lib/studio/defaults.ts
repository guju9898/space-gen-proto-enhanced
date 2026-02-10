import { InteriorConfig, LandscapeConfig, ExteriorConfig } from "@/types/studio"

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

export const landscapeDefaults: LandscapeConfig = {
  gardenType: "Residential",
  style: "modern",
  colorPalette: "neutral",
  lighting: "Daylight",
  image: null,
  realism: 50,
  advanced: {
    architectInfluence: "none",
    lens: "standard",
    geometry: "balanced",
    symmetry: "subtle",
    mood: "neutral"
  }
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
  advanced: {
    architectInfluence: "none",
    lens: "standard",
    geometry: "balanced",
    symmetry: "subtle",
    mood: "neutral"
  }
}


