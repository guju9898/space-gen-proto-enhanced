"use client"

import { useState } from "react"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import { StudioPageLayout, FormSection } from "@/components/Studio/StudioPageLayout"
import { Button } from "@/components/ui/button"
import { useDesignConfig } from "@/hooks/useDesignConfig"
import { InteriorConfig } from "@/types/studio"
import { Wand2, ImageIcon, Bed, Sofa, Utensils, Bath, Briefcase, Sun, Moon, Cloud, Palette, Droplet, Zap } from "lucide-react"
import { PreviewCard } from "@/components/Studio/PreviewCard"
import { LatestRenders } from "@/components/Studio/LatestRenders"
import { VisualSelector } from "@/components/Studio/VisualSelector"
import { TagGroup } from "@/components/Studio/TagGroup"

const roomTypeOptions = [
  { value: "living", label: "Living Room", icon: Sofa },
  { value: "bedroom", label: "Bedroom", icon: Bed },
  { value: "kitchen", label: "Kitchen", icon: Utensils },
  { value: "bathroom", label: "Bathroom", icon: Bath },
  { value: "office", label: "Office", icon: Briefcase },
]

const styleOptions = [
  { value: "modern", label: "Modern", thumbnail: "/styles/modern.jpg" },
  { value: "traditional", label: "Traditional", thumbnail: "/styles/traditional.jpg" },
  { value: "minimalist", label: "Minimalist", thumbnail: "/styles/minimalist.jpg" },
]

const lightingOptions = [
  { value: "daylight", label: "Daylight", icon: Sun },
  { value: "evening", label: "Evening", icon: Moon },
  { value: "overcast", label: "Overcast", icon: Cloud },
]

const colorPaletteOptions = [
  { value: "neutral", label: "Neutral", color: "#f5f5f5" },
  { value: "warm", label: "Warm", color: "#fef3c7" },
  { value: "cool", label: "Cool", color: "#e0f2fe" },
]

export default function InteriorStudioPage() {
  const { config, updateConfig } = useDesignConfig()
  const interiorConfig = config?.interior || {
    roomType: "living",
    style: "modern",
    colorPalette: "neutral",
    lighting: "daylight"
  }

  const handleConfigChange = (updates: Partial<InteriorConfig>) => {
    updateConfig('interior', {
      ...interiorConfig,
      ...updates
    })
  }

  const handleTagRemove = (key: keyof InteriorConfig) => {
    if (key === 'roomType') return // Prevent removing required field
    handleConfigChange({ [key]: undefined })
  }

  const handleClearAll = () => {
    handleConfigChange({
      style: undefined,
      colorPalette: undefined,
      lighting: undefined
    })
  }

  const renderButton = (
    <Button
      className="w-full bg-gradient-to-r from-[#FF6B00] to-[#9747ff] text-white hover:opacity-90"
      size="lg"
    >
      <Wand2 className="mr-2 h-4 w-4" />
      Render Design
    </Button>
  )

  const formContent = (
    <div className="space-y-6">
      <PreviewCard
        label="Your current interior"
        tips="Use a bright, wide-angle photo for best AI results"
      />

      <FormSection title="Room type">
        <VisualSelector
          options={roomTypeOptions}
          value={interiorConfig.roomType}
          onChange={(value) => handleConfigChange({ roomType: value as InteriorConfig['roomType'] })}
        />
      </FormSection>

      <FormSection title="Design style">
        <VisualSelector
          options={styleOptions}
          value={interiorConfig.style}
          onChange={(value) => handleConfigChange({ style: value as InteriorConfig['style'] })}
        />
      </FormSection>

      <FormSection title="Lighting">
        <VisualSelector
          options={lightingOptions}
          value={interiorConfig.lighting}
          onChange={(value) => handleConfigChange({ lighting: value as InteriorConfig['lighting'] })}
        />
      </FormSection>

      <FormSection title="Color palette">
        <VisualSelector
          options={colorPaletteOptions}
          value={interiorConfig.colorPalette}
          onChange={(value) => handleConfigChange({ colorPalette: value as InteriorConfig['colorPalette'] })}
        />
      </FormSection>
    </div>
  )

  const previewContent = (
    <div className="space-y-6">
      <div className="aspect-video bg-muted rounded-xl border border-border shadow-sm flex items-center justify-center">
        <p className="text-muted-foreground">Preview will appear here</p>
      </div>
      <LatestRenders renders={[]} />
    </div>
  )

  const requestContent = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Request Summary</h3>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleClearAll}
        >
          Clear all
        </Button>
      </div>
      <div className="space-y-4">
        <TagGroup
          title="Room"
          icon={Sofa}
          tags={[
            {
              label: "Type",
              value: interiorConfig.roomType,
              icon: Sofa,
              required: true
            }
          ]}
        />
        <TagGroup
          title="Style"
          icon={Palette}
          tags={[
            {
              label: "Design",
              value: interiorConfig.style,
              icon: Palette,
              onRemove: () => handleTagRemove("style")
            }
          ]}
        />
        <TagGroup
          title="Lighting"
          icon={Zap}
          tags={[
            {
              label: "Time",
              value: interiorConfig.lighting,
              icon: Zap,
              onRemove: () => handleTagRemove("lighting")
            }
          ]}
        />
        <TagGroup
          title="Colors"
          icon={Droplet}
          tags={[
            {
              label: "Palette",
              value: interiorConfig.colorPalette,
              icon: Droplet,
              onRemove: () => handleTagRemove("colorPalette")
            }
          ]}
        />
      </div>
    </div>
  )

  return (
    <StudioPageLayout
      formContent={formContent}
      previewContent={previewContent}
      requestContent={requestContent}
      renderButton={renderButton}
    />
  )
} 