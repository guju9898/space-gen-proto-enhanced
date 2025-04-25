import { useDesignConfig } from "@/hooks/useDesignConfig";
import { ExteriorConfig } from "@/types/studio";

const defaultConfig: ExteriorConfig = {
  buildingType: "house",
  architecturalStyle: "modern",
  surroundingEnvironment: "urban",
  timeOfDay: "day",
  style: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  image: null
};

export function useExteriorConfig() {
  const { config, updateConfig, resetConfig } = useDesignConfig();
  
  if (!config?.exterior) {
    console.warn('Exterior config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {},
      resetConfig: () => {}
    };
  }

  return {
    config: config.exterior,
    updateConfig: (updates: Partial<ExteriorConfig>) => updateConfig('exterior', updates),
    resetConfig: () => resetConfig('exterior')
  };
} 