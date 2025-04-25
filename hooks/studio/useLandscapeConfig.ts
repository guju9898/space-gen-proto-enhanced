import { useDesignConfig } from "@/hooks/useDesignConfig";
import { LandscapeConfig } from "@/types/studio";

const defaultConfig: LandscapeConfig = {
  gardenType: "residential",
  style: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  image: null
};

export function useLandscapeConfig() {
  const { config, updateConfig, resetConfig } = useDesignConfig();
  
  if (!config?.landscape) {
    console.warn('Landscape config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {},
      resetConfig: () => {}
    };
  }

  return {
    config: config.landscape,
    updateConfig: (updates: Partial<LandscapeConfig>) => updateConfig('landscape', updates),
    resetConfig: () => resetConfig('landscape')
  };
} 