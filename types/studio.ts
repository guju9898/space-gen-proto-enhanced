export interface BaseRenderConfig {
  style: string;
  colorPalette: string;
  lighting: number;
  sourceImage?: string;
}

export interface InteriorConfig {
  roomType: string;
  style?: string;
  colorPalette?: string;
  lighting?: string;
  furnitureStyle?: string;
  wallColor?: string;
  floorMaterial?: string;
}

export interface ExteriorConfig {
  buildingType: string;
  architecturalStyle: string;
  surroundingEnvironment: string;
  timeOfDay: string;
  style: string;
  colorPalette: string;
  lighting: number;
}

export interface LandscapeConfig extends BaseRenderConfig {
  terrainType: string;
  vegetation: string;
  season: string;
  timeOfDay: string;
}

export interface ProductConfig extends BaseRenderConfig {
  productType: string;
  material: string;
  backgroundStyle: string;
  perspective: string;
}

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