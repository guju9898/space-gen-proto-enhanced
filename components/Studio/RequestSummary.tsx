"use client"

import { X } from "lucide-react"
import { useDesignConfig } from "@/hooks/useDesignConfig"
import { ExteriorConfig, InteriorConfig, LandscapeConfig } from "@/types/studio"

interface TagProps {
  label: string
  value: string
  onRemove?: () => void
  isRequired?: boolean
}

function Tag({ label, value, onRemove, isRequired }: TagProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-md text-sm">
      <span className="text-muted-foreground">{label}:</span>
      <span className="text-white">{value}</span>
      {!isRequired && onRemove && (
        <button
          onClick={onRemove}
          className="text-muted-foreground hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

export default function RequestSummary() {
  const { config, updateConfig } = useDesignConfig()
  const activeConfig = config[config.activeStudio]

  const handleRemoveTag = (key: string) => {
    if (config.activeStudio === 'interior') {
      const interiorConfig = activeConfig as InteriorConfig
      if (key === 'roomType') return // Don't remove required field
      updateConfig('interior', { [key]: '' })
    } else if (config.activeStudio === 'exterior') {
      const exteriorConfig = activeConfig as ExteriorConfig
      if (key === 'buildingType') return // Don't remove required field
      updateConfig('exterior', { [key]: '' })
    } else if (config.activeStudio === 'landscape') {
      const landscapeConfig = activeConfig as LandscapeConfig
      if (key === 'terrainType') return // Don't remove required field
      updateConfig('landscape', { [key]: '' })
    }
  }

  const handleClearAll = () => {
    if (config.activeStudio === 'interior') {
      updateConfig('interior', {
        roomType: 'living',
        style: '',
        colorPalette: '',
        lighting: 50,
        furnitureStyle: '',
        wallColor: '',
        floorMaterial: ''
      })
    } else if (config.activeStudio === 'exterior') {
      updateConfig('exterior', {
        buildingType: '',
        architecturalStyle: '',
        surroundingEnvironment: '',
        timeOfDay: '',
        style: '',
        colorPalette: '',
        lighting: 50
      })
    } else if (config.activeStudio === 'landscape') {
      updateConfig('landscape', {
        terrainType: '',
        vegetation: '',
        season: '',
        timeOfDay: '',
        style: '',
        colorPalette: '',
        lighting: 50
      })
    }
  }

  const renderTags = () => {
    if (config.activeStudio === 'interior') {
      const interiorConfig = activeConfig as InteriorConfig
      return (
        <>
          <Tag
            label="Room Type"
            value={interiorConfig.roomType}
            isRequired
          />
          {interiorConfig.style && (
            <Tag
              label="Style"
              value={interiorConfig.style}
              onRemove={() => handleRemoveTag('style')}
            />
          )}
          {interiorConfig.colorPalette && (
            <Tag
              label="Color Palette"
              value={interiorConfig.colorPalette}
              onRemove={() => handleRemoveTag('colorPalette')}
            />
          )}
          {interiorConfig.furnitureStyle && (
            <Tag
              label="Furniture Style"
              value={interiorConfig.furnitureStyle}
              onRemove={() => handleRemoveTag('furnitureStyle')}
            />
          )}
          {interiorConfig.wallColor && (
            <Tag
              label="Wall Color"
              value={interiorConfig.wallColor}
              onRemove={() => handleRemoveTag('wallColor')}
            />
          )}
          {interiorConfig.floorMaterial && (
            <Tag
              label="Floor Material"
              value={interiorConfig.floorMaterial}
              onRemove={() => handleRemoveTag('floorMaterial')}
            />
          )}
        </>
      )
    } else if (config.activeStudio === 'exterior') {
      const exteriorConfig = activeConfig as ExteriorConfig
      return (
        <>
          <Tag
            label="Building Type"
            value={exteriorConfig.buildingType}
            isRequired
          />
          {exteriorConfig.architecturalStyle && (
            <Tag
              label="Architectural Style"
              value={exteriorConfig.architecturalStyle}
              onRemove={() => handleRemoveTag('architecturalStyle')}
            />
          )}
          {exteriorConfig.surroundingEnvironment && (
            <Tag
              label="Environment"
              value={exteriorConfig.surroundingEnvironment}
              onRemove={() => handleRemoveTag('surroundingEnvironment')}
            />
          )}
          {exteriorConfig.timeOfDay && (
            <Tag
              label="Time of Day"
              value={exteriorConfig.timeOfDay}
              onRemove={() => handleRemoveTag('timeOfDay')}
            />
          )}
          {exteriorConfig.style && (
            <Tag
              label="Style"
              value={exteriorConfig.style}
              onRemove={() => handleRemoveTag('style')}
            />
          )}
          {exteriorConfig.colorPalette && (
            <Tag
              label="Color Palette"
              value={exteriorConfig.colorPalette}
              onRemove={() => handleRemoveTag('colorPalette')}
            />
          )}
          {exteriorConfig.lighting !== 50 && (
            <Tag
              label="Lighting"
              value={`${exteriorConfig.lighting}%`}
              onRemove={() => handleRemoveTag('lighting')}
            />
          )}
        </>
      )
    } else if (config.activeStudio === 'landscape') {
      const landscapeConfig = activeConfig as LandscapeConfig
      return (
        <>
          <Tag
            label="Terrain Type"
            value={landscapeConfig.terrainType}
            isRequired
          />
          {landscapeConfig.vegetation && (
            <Tag
              label="Vegetation"
              value={landscapeConfig.vegetation}
              onRemove={() => handleRemoveTag('vegetation')}
            />
          )}
          {landscapeConfig.season && (
            <Tag
              label="Season"
              value={landscapeConfig.season}
              onRemove={() => handleRemoveTag('season')}
            />
          )}
          {landscapeConfig.timeOfDay && (
            <Tag
              label="Time of Day"
              value={landscapeConfig.timeOfDay}
              onRemove={() => handleRemoveTag('timeOfDay')}
            />
          )}
          {landscapeConfig.style && (
            <Tag
              label="Style"
              value={landscapeConfig.style}
              onRemove={() => handleRemoveTag('style')}
            />
          )}
          {landscapeConfig.colorPalette && (
            <Tag
              label="Color Palette"
              value={landscapeConfig.colorPalette}
              onRemove={() => handleRemoveTag('colorPalette')}
            />
          )}
          {landscapeConfig.lighting !== 50 && (
            <Tag
              label="Lighting"
              value={`${landscapeConfig.lighting}%`}
              onRemove={() => handleRemoveTag('lighting')}
            />
          )}
        </>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Request Summary</h3>
        <button
          onClick={handleClearAll}
          className="text-sm text-muted-foreground hover:text-white transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {renderTags()}
      </div>
    </div>
  )
}
