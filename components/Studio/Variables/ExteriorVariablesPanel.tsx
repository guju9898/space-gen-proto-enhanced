"use client"

import { useState } from "react"
import { useDesignConfig } from "@/hooks/useDesignConfig"
import ImageSelector from "./ImageSelector"
import { DropdownSelector } from "./DropdownSelector"
import TagSelector from "./TagSelector"
import SliderControl from "./SliderControl"
import { Palette, Clock, Home, Layers } from "lucide-react"
import SafeImage from "@/components/SafeImage"

// Mock data for the exterior selectors
const exteriorTypes = [
  { id: "residential", label: "Residential", imageUrl: "/studio/exterior/residential-thumbnail.jpg" },
  { id: "commercial", label: "Commercial", imageUrl: "/studio/exterior/commercial-thumbnail.jpg" },
  { id: "multi-family", label: "Multi-Family", imageUrl: "/studio/exterior/multi-family-thumbnail.jpg" },
  { id: "townhouse", label: "Townhouse", imageUrl: "/studio/exterior/townhouse-thumbnail.jpg" },
]

const architecturalStyles = [
  { id: "modern", label: "Modern", imageUrl: "/studio/exterior/modern-thumbnail.jpg" },
  { id: "traditional", label: "Traditional", imageUrl: "/studio/exterior/traditional-thumbnail.jpg" },
  { id: "contemporary", label: "Contemporary", imageUrl: "/studio/exterior/contemporary-thumbnail.jpg" },
  { id: "craftsman", label: "Craftsman", imageUrl: "/studio/exterior/craftsman-thumbnail.jpg" },
]

const colorPalettes = [
  { value: "neutral", label: "Neutral" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "earthy", label: "Earthy" },
  { value: "bold", label: "Bold" },
]

const timeOfDayOptions = [
  { value: "morning", label: "Morning" },
  { value: "midday", label: "Midday" },
  { value: "afternoon", label: "Afternoon" },
  { value: "sunset", label: "Sunset" },
  { value: "night", label: "Night" },
]

const roofStyleOptions = [
  { value: "gable", label: "Gable" },
  { value: "hip", label: "Hip" },
  { value: "flat", label: "Flat" },
  { value: "mansard", label: "Mansard" },
  { value: "shed", label: "Shed" },
]

const exteriorMaterialOptions = [
  { value: "brick", label: "Brick" },
  { value: "wood", label: "Wood" },
  { value: "stucco", label: "Stucco" },
  { value: "stone", label: "Stone" },
  { value: "vinyl", label: "Vinyl" },
  { value: "fiber-cement", label: "Fiber Cement" },
  { value: "metal", label: "Metal" },
]

const exteriorAccentOptions = [
  { value: "shutters", label: "Shutters" },
  { value: "columns", label: "Columns" },
  { value: "trim", label: "Trim" },
  { value: "balcony", label: "Balcony" },
  { value: "porch", label: "Porch" },
  { value: "awnings", label: "Awnings" },
]

const viewOptions = [
  { value: "front", label: "Front" },
  { value: "side", label: "Side" },
  { value: "aerial", label: "Aerial" },
  { value: "street", label: "Street" },
  { value: "backyard", label: "Backyard" },
]

const focalPointOptions = [
  { value: "entrance", label: "Entrance" },
  { value: "whole-house", label: "Whole House" },
  { value: "landscaping", label: "Landscaping" },
  { value: "architectural-detail", label: "Architectural Detail" },
]

interface ExteriorVariablesPanelProps {
  onGenerateDesign?: (config: any) => void
}

export default function ExteriorVariablesPanel({ onGenerateDesign }: ExteriorVariablesPanelProps) {
  const { config, updateTypeConfig, renderType } = useDesignConfig()
  const [cachedRenders, setCachedRenders] = useState<string[]>([])

  const exterior = config.exterior || {
    exteriorType: null,
    architecturalStyle: null,
    colorPalette: null,
    timeOfDay: null,
    roofStyle: null,
    exteriorMaterials: [],
    exteriorAccents: [],
    focalPoint: null,
    views: [],
    realism: 70,
  }

  // Helper function to update exterior config using the new updateTypeConfig
  const updateExteriorConfig = (key: string, value: any) => {
    updateTypeConfig("exterior", key, value)
  }

  const handleGenerateDesign = () => {
    console.log("Current exterior configuration:", exterior)
    if (onGenerateDesign) {
      onGenerateDesign(exterior)
    }

    // In a real app, this would be the response from the API
    const mockNewRender = "/studio/exterior/generated-exterior.jpg"

    // Add to cached renders (limited to 5 most recent)
    setCachedRenders((prev) => [mockNewRender, ...prev.slice(0, 4)])
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto">
      {/* Exterior Type */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Exterior type</h3>
        <ImageSelector
          options={exteriorTypes}
          value={exterior.exteriorType ?? null}
          onChange={(value) => updateExteriorConfig("exteriorType", value)}
        />
      </div>

      {/* Architectural Style */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Architectural style</h3>
        <ImageSelector
          options={architecturalStyles}
          value={exterior.architecturalStyle ?? null}
          onChange={(value) => updateExteriorConfig("architecturalStyle", value)}
        />
      </div>

      {/* Color Palette */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Color Palette</h3>
        <DropdownSelector
          options={colorPalettes}
          value={exterior.colorPalette ?? ""}
          onChange={(value) => updateExteriorConfig("colorPalette", value)}
          placeholder="Select color palette"
          icon={Palette}
        />
      </div>

      {/* Time of Day */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Time of Day</h3>
        <DropdownSelector
          options={timeOfDayOptions}
          value={exterior.timeOfDay ?? ""}
          onChange={(value) => updateExteriorConfig("timeOfDay", value)}
          placeholder="Select time of day"
          icon={Clock}
        />
      </div>

      {/* Roof Style */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Roof Style</h3>
        <DropdownSelector
          options={roofStyleOptions}
          value={exterior.roofStyle ?? ""}
          onChange={(value) => updateExteriorConfig("roofStyle", value)}
          placeholder="Select roof style"
          icon={Home}
        />
      </div>

      {/* Exterior Materials */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Exterior Materials</h3>
        <TagSelector
          options={exteriorMaterialOptions}
          selectedValues={Array.isArray(exterior.exteriorMaterials) ? exterior.exteriorMaterials : (exterior.exteriorMaterials ? [exterior.exteriorMaterials] : [])}
          onChange={(values) => updateExteriorConfig("exteriorMaterials", values)}
          maxSelections={3}
        />
      </div>

      {/* Exterior Accents */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Exterior Accents</h3>
        <TagSelector
          options={exteriorAccentOptions}
          selectedValues={Array.isArray(exterior.exteriorAccents) ? exterior.exteriorAccents : (exterior.exteriorAccents ? [exterior.exteriorAccents] : [])}
          onChange={(values) => updateExteriorConfig("exteriorAccents", values)}
          maxSelections={3}
        />
      </div>

      {/* Focal Point */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Focal Point</h3>
        <DropdownSelector
          options={focalPointOptions}
          value={exterior.focalPoint ?? ""}
          onChange={(value) => updateExteriorConfig("focalPoint", value)}
          placeholder="Select focal point"
          icon={Layers}
        />
      </div>

      {/* Views */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Views</h3>
        <TagSelector
          options={viewOptions}
          selectedValues={Array.isArray((exterior as unknown as Record<string, unknown>).views) ? (exterior as unknown as Record<string, unknown>).views as string[] : (exterior.exteriorViews ? [exterior.exteriorViews] : [])}
          onChange={(values) => updateExteriorConfig("views", values)}
          maxSelections={2}
        />
      </div>

      {/* Realism Slider */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Realism</h3>
        <SliderControl
          min={0}
          max={100}
          step={10}
          value={exterior.realism || 70}
          onChange={(value) => updateExteriorConfig("realism", value)}
          labels={["Stylized", "Photorealistic"]}
        />
      </div>

      {/* Cached Renders (History) */}
      {cachedRenders.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 text-white">Recent Renders</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {cachedRenders.map((renderUrl, index) => {
              const validRenderUrl = renderUrl && renderUrl.trim() !== ""

              return (
                <div key={index} className="relative min-w-[80px] h-[80px] rounded-md overflow-hidden">
                  {validRenderUrl && (
                    <SafeImage
                      src={renderUrl}
                      alt={`Cached render ${index + 1}`}
                      fill
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
