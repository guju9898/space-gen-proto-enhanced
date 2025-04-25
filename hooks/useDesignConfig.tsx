"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { InteriorConfig, ExteriorConfig, LandscapeConfig, ProductConfig, StudioType } from "@/types/studio"

interface DesignConfigContextType {
  interior: InteriorConfig;
  exterior: ExteriorConfig;
  landscape: LandscapeConfig;
  product: ProductConfig;
  activeStudio: StudioType;
  updateConfig: (updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig>) => void;
  setActiveStudio: (studio: StudioType) => void;
}

const defaultConfig = {
  interior: {
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
    image: null,
    realism: 50
  },
  exterior: {
    buildingType: "house",
    architecturalStyle: "modern",
    surroundingEnvironment: "urban",
    timeOfDay: "day",
    style: "modern",
    colorPalette: "neutral",
    lighting: "natural",
    image: null,
    realism: 50
  },
  landscape: {
    gardenType: "residential",
    style: "modern",
    colorPalette: "neutral",
    lighting: "natural",
    image: null,
    realism: 50
  },
  product: {
    productType: "furniture",
    style: "modern",
    colorPalette: "neutral",
    material: "wood",
    image: null,
    realism: 50
  }
} as const

const DesignConfigContext = createContext<DesignConfigContextType | undefined>(undefined)

export function DesignConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultConfig)
  const [activeStudio, setActiveStudio] = useState<StudioType>("interior")

  const updateConfig = (updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig>) => {
    setConfig(prev => ({
      ...prev,
      [activeStudio]: {
        ...prev[activeStudio],
        ...updates
      }
    }))
  }

  const value = {
    ...config,
    activeStudio,
    updateConfig,
    setActiveStudio
  }

  return (
    <DesignConfigContext.Provider value={value}>
      {children}
    </DesignConfigContext.Provider>
  )
}

export function useDesignConfig() {
  const context = useContext(DesignConfigContext)
  if (context === undefined) {
    throw new Error("useDesignConfig must be used within a DesignConfigProvider")
  }
  return context
}

export function useInteriorConfig() {
  const context = useDesignConfig()
  return {
    config: context.interior,
    updateConfig: (updates: Partial<InteriorConfig>) => context.updateConfig(updates)
  }
}

export function useExteriorConfig() {
  const context = useDesignConfig()
  return {
    config: context.exterior,
    updateConfig: (updates: Partial<ExteriorConfig>) => context.updateConfig(updates)
  }
}

export function useLandscapeConfig() {
  const context = useDesignConfig()
  return {
    config: context.landscape,
    updateConfig: (updates: Partial<LandscapeConfig>) => context.updateConfig(updates)
  }
}

export function useProductConfig() {
  const context = useDesignConfig()
  return {
    config: context.product,
    updateConfig: (updates: Partial<ProductConfig>) => context.updateConfig(updates)
  }
} 