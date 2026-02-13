export interface BaseRenderConfig {
  style: string;
  colorPalette: string;
  image: File | null;
}

export interface AdvancedConfig {
  architectInfluence?: string;
  lens?: string;
  geometry?: string;
  symmetry?: string;
  mood?: string;
}

export interface InteriorConfig {
  roomType: string;
  designStyle: string;
  colorPalette: string;
  lighting: string;
  timeOfDay: string;
  mood: string;
  architect: string;
  lens: string;
  typology: string;
  geometry: string;
  realism: number;
  image: File | null;
  roomLayout?: string;
  cameraAngle?: string;
  viewType?: string;
  compositionStyle?: string;
  focalPoint?: string;
  framing?: string;
  negativeSpace?: string;
  patternsRepetition?: string;
  symmetryLevel?: number;
  flooring?: string;
  textures?: string;
}

export interface ExteriorConfig {
  buildingType: string;
  architecturalStyle: string;
  surroundingEnvironment: string;
  timeOfDay: string;
  style: string;
  colorPalette: string;
  lighting: string;
  image: File | null;
  realism: number;
  advanced: AdvancedConfig;
  exteriorType?: string;
  cameraAngle?: string;
  exteriorMaterials?: string;
  roofStyle?: string;
  outdoorFurnishings?: string;
  exteriorAccents?: string;
  exteriorViews?: string;
  focalPoint?: string;
  symmetryType?: string;
  symmetryLevel?: number;
  landscapingElements?: string;
}

export interface LandscapeConfig {
  gardenType: string;
  style: string;
  colorPalette: string;
  lighting: string;
  image: File | null;
  realism: number;
  advanced: AdvancedConfig;
  themeStyle?: string;
  timeOfDay?: string;
  plantTypes?: string;
  plantingDensity?: number;
  topography?: string;
  outdoorFurniture?: string;
  seatingFeature?: string;
  structures?: string;
  lightingIntensity?: number;
  playActivityArea?: string;
  interactiveElements?: string;
  wallMaterials?: string;
  climateZone?: string;
  weather?: string;
  scale?: string;
  geometry?: string;
  gardenGeometry?: string;
  cameraAngle?: string;
  wildlifeElements?: string;
  hardscaping?: string;
  waterFeature?: string;
}

export interface ProductConfig {
  productType: string;
  style: string;
  colorPalette: string;
  material: string;
  image: File | null;
  realism: number;
}

export type StudioType = "interior" | "exterior" | "landscape" | "product";

export type DesignConfig = {
  interior: InteriorConfig;
  exterior: ExteriorConfig;
  landscape: LandscapeConfig;
  activeStudio: StudioType;
};

export interface RenderRequest {
  renderType: 'interior' | 'exterior' | 'landscape' | 'product';
  config: InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig;
  sourceImage?: string;
}

export interface RenderResponse {
  imageUrl: string;
  prompt: string;
  timestamp: string;
  error?: string;
}

export interface StudioState {
  currentImage: string | null;
  isRendering: boolean;
  lastResult: RenderResponse | null;
  config: InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig;
} 