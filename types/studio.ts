export interface BaseRenderConfig {
  style: string;
  colorPalette: string;
  image: File | null;
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
  image: File | null;
  realism: number;
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
}

export interface LandscapeConfig {
  gardenType: string;
  style: string;
  colorPalette: string;
  lighting: string;
  image: File | null;
  realism: number;
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