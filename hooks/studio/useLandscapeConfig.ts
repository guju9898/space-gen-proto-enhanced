import { useDesignConfig } from "@/hooks/useDesignConfig";
import { LandscapeConfig, AdvancedConfig } from "@/types/studio";

const landscapeAdvancedDefaults: AdvancedConfig = {
  architectInfluence: "none",
  lens: "standard",
  geometry: "balanced",
  symmetry: "subtle",
  mood: "neutral"
};

const defaultConfig: LandscapeConfig = {
  gardenType: "Residential",
  style: "modern",
  colorPalette: "neutral",
  lighting: "Daylight",
  image: null,
  realism: 50,
  advanced: landscapeAdvancedDefaults
};

export function useLandscapeConfig() {
  const { landscape, updateConfig, setActiveStudio } = useDesignConfig();
  
  if (!landscape) {
    console.warn('Landscape config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {}
    };
  }

  return {
    config: landscape,
    updateConfig: (updates: Partial<LandscapeConfig>) => {
      setActiveStudio('landscape');
      updateConfig(updates);
    }
  };
} 