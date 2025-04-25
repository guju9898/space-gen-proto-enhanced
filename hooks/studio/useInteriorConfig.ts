import { useDesignConfig } from "@/hooks/useDesignConfig";
import { InteriorConfig } from "@/types/studio";

const defaultConfig: InteriorConfig = {
  roomType: "living",
  style: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  mood: "cozy",
  timeOfDay: "day",
  image: null
};

export function useInteriorConfig() {
  const { config, updateConfig, resetConfig } = useDesignConfig();
  
  if (!config?.interior) {
    console.warn('Interior config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {},
      resetConfig: () => {}
    };
  }

  return {
    config: config.interior,
    updateConfig: (updates: Partial<InteriorConfig>) => updateConfig('interior', updates),
    resetConfig: () => resetConfig('interior')
  };
} 