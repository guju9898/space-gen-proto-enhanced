"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { InteriorConfig, ExteriorConfig, LandscapeConfig, ProductConfig, StudioType } from "@/types/studio"
import { interiorDefaults, landscapeDefaults, exteriorDefaults, productDefaults } from "@/lib/studio/defaults"

type ConfigUpdates = Partial<InteriorConfig | ExteriorConfig | LandscapeConfig | ProductConfig>;

interface DesignConfigContextType {
  interior: InteriorConfig;
  exterior: ExteriorConfig;
  landscape: LandscapeConfig;
  product: ProductConfig;
  activeStudio: StudioType;
  /** Backward-compat: same as { interior, exterior, landscape, product } */
  config: {
    interior: InteriorConfig;
    exterior: ExteriorConfig;
    landscape: LandscapeConfig;
    product: ProductConfig;
  };
  /** Backward-compat: alias for activeStudio */
  renderType: StudioType;
  /** (updates) or (key, value) for active studio */
  updateConfig: (updatesOrKey: ConfigUpdates | string, value?: unknown) => void;
  /** Backward-compat: update single key for specified studio */
  updateTypeConfig: (studio: StudioType, key: string, value: unknown) => void;
  setActiveStudio: (studio: StudioType) => void;
  resetConfig: (studio?: StudioType) => void;
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

const studioDefaults: typeof defaultConfig = {
  interior: interiorDefaults,
  exterior: exteriorDefaults,
  landscape: landscapeDefaults,
  product: productDefaults
}

export function DesignConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(defaultConfig)
  const [activeStudio, setActiveStudio] = useState<StudioType>("interior")

  const updateConfig = (updatesOrKey: ConfigUpdates | string, value?: unknown) => {
    if (typeof updatesOrKey === "string") {
      setConfig(prev => {
        const studioKey = activeStudio as keyof typeof defaultConfig
        return {
          ...prev,
          [studioKey]: {
            ...prev[studioKey],
            [updatesOrKey]: value
          }
        }
      })
      return
    }
    setConfig(prev => {
      const studioKey = activeStudio as keyof typeof defaultConfig
      return {
        ...prev,
        [studioKey]: {
          ...prev[studioKey],
          ...updatesOrKey
        }
      }
    })
  }

  const updateTypeConfig = (studio: StudioType, key: string, value: unknown) => {
    setActiveStudio(studio)
    setConfig(prev => {
      const studioKey = studio as keyof typeof defaultConfig
      return {
        ...prev,
        [studioKey]: {
          ...prev[studioKey],
          [key]: value
        }
      }
    })
  }

  const resetConfig = (studio?: StudioType) => {
    const target = studio ?? activeStudio
    setConfig(prev => ({
      ...prev,
      [target]: studioDefaults[target as keyof typeof studioDefaults]
    }))
  }

  const value: DesignConfigContextType = {
    ...config,
    activeStudio,
    config: { interior: config.interior, exterior: config.exterior, landscape: config.landscape, product: config.product },
    renderType: activeStudio,
    updateConfig,
    updateTypeConfig,
    setActiveStudio,
    resetConfig
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
