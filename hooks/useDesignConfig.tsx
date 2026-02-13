"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { InteriorConfig, ExteriorConfig, LandscapeConfig, ProductConfig, StudioType } from "@/types/studio"
import { interiorDefaults, landscapeDefaults, exteriorDefaults, productDefaults } from "@/lib/studio/defaults"

interface DesignConfigContextType {
  interior: InteriorConfig;
  exterior: ExteriorConfig;
  landscape: LandscapeConfig;
  product: ProductConfig;
  activeStudio: StudioType;
  updateConfig: (updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig>) => void;
  setActiveStudio: (studio: StudioType) => void;
}

const defaultConfig: {
  interior: InteriorConfig;
  exterior: ExteriorConfig;
  landscape: LandscapeConfig;
  product: ProductConfig;
} = {
  interior: interiorDefaults,
  exterior: exteriorDefaults,
  landscape: landscapeDefaults,
  product: productDefaults
}

const DesignConfigContext = createContext<DesignConfigContextType | undefined>(undefined)

export function DesignConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultConfig)
  const [activeStudio, setActiveStudio] = useState<StudioType>("interior")

  const updateConfig = (updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig>) => {
    setConfig(prev => {
      const studioKey = activeStudio as keyof typeof defaultConfig
      return {
        ...prev,
        [studioKey]: {
          ...prev[studioKey],
          ...updates
        }
      }
    })
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
