import { useDesignConfig } from "@/hooks/useDesignConfig";
import { InteriorConfig } from "@/types/studio";

const defaultConfig: InteriorConfig = {
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
};

export function useInteriorConfig() {
  const { interior, updateConfig, setActiveStudio } = useDesignConfig();
  
  if (!interior) {
    console.warn('Interior config is not initialized');
    return {
      config: defaultConfig,
      updateConfig: () => {}
    };
  }

  return {
    config: interior,
    updateConfig: (updates: Partial<InteriorConfig>) => {
      setActiveStudio('interior');
      updateConfig(updates);
    }
  };
} 