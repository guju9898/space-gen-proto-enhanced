"use client"

import * as React from "react"
import type { ReactNode, ReactElement } from "react"
import { BaseRenderConfig, ExteriorConfig, InteriorConfig, LandscapeConfig } from "@/types/studio"

type StudioType = 'interior' | 'exterior' | 'landscape'

interface DesignConfig {
  interior: InteriorConfig
  exterior: ExteriorConfig
  landscape: LandscapeConfig
  activeStudio: StudioType
}

interface DesignConfigContextType {
  config: DesignConfig
  updateConfig: (studioType: StudioType, updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig>) => void
  setActiveStudio: (type: StudioType) => void
}

const defaultConfig: DesignConfig = {
  activeStudio: 'interior',
  interior: {
    roomType: 'living',
    style: 'modern',
    colorPalette: 'neutral',
    lighting: 50,
    furnitureStyle: 'modern',
    wallColor: 'white',
    floorMaterial: 'wood'
  },
  exterior: {
    buildingType: 'house',
    architecturalStyle: 'modern',
    surroundingEnvironment: 'urban',
    timeOfDay: 'day',
    style: 'modern',
    colorPalette: 'neutral',
    lighting: 50
  },
  landscape: {
    terrainType: 'flat',
    vegetation: 'grass',
    season: 'summer',
    timeOfDay: 'day',
    style: 'modern',
    colorPalette: 'neutral',
    lighting: 50
  }
}

const DesignConfigContext = React.createContext<DesignConfigContextType | null>(null)
DesignConfigContext.displayName = 'DesignConfigContext'

export function DesignConfigProvider({ children }: { children: ReactNode }): ReactElement {
  const [config, setConfig] = React.useState<DesignConfig>(defaultConfig)

  const updateConfig = React.useCallback((
    studioType: StudioType,
    updates: Partial<InteriorConfig | ExteriorConfig | LandscapeConfig>
  ) => {
    setConfig(prev => ({
      ...prev,
      [studioType]: {
        ...prev[studioType],
        ...updates
      }
    }))
  }, [])

  const setActiveStudio = React.useCallback((type: StudioType) => {
    setConfig(prev => ({
      ...prev,
      activeStudio: type
    }))
  }, [])

  const contextValue: DesignConfigContextType = {
    config,
    updateConfig,
    setActiveStudio
  }

  return React.createElement(
    DesignConfigContext.Provider,
    { value: contextValue },
    children
  )
}

export function useDesignConfig() {
  const context = React.useContext(DesignConfigContext)
  if (!context) {
    throw new Error('useDesignConfig must be used within a DesignConfigProvider')
  }
  return context
}

// Studio-specific hooks
export function useInteriorConfig() {
  const { config, updateConfig } = useDesignConfig()
  return {
    config: config.interior,
    updateConfig: (updates: Partial<InteriorConfig>) => updateConfig('interior', updates)
  }
}

export function useExteriorConfig() {
  const { config, updateConfig } = useDesignConfig()
  return {
    config: config.exterior,
    updateConfig: (updates: Partial<ExteriorConfig>) => updateConfig('exterior', updates)
  }
}

export function useLandscapeConfig() {
  const { config, updateConfig } = useDesignConfig()
  return {
    config: config.landscape,
    updateConfig: (updates: Partial<LandscapeConfig>) => updateConfig('landscape', updates)
  }
}
