import { useDesignConfig } from "@/hooks/useDesignConfig";
import { ExteriorConfig, AdvancedConfig } from "@/types/studio";

const exteriorAdvancedDefaults: AdvancedConfig = {
  architectInfluence: "none",
  lens: "standard",
  geometry: "balanced",
  symmetry: "subtle",
  mood: "neutral"
};

const defaultConfig: ExteriorConfig = {
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
};

export function useExteriorConfig() {
  const { exterior, updateConfig, setActiveStudio } = useDesignConfig();
  
  if (!exterior) {
    console.warn('Exterior config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {}
    };
  }

  return {
    config: exterior,
    updateConfig: (updates: Partial<ExteriorConfig>) => {
      setActiveStudio('exterior');
      updateConfig(updates);
    }
  };
} 