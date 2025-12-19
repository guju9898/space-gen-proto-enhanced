"use client"
import ImageSelector from "./ImageSelector"
import { DropdownSelector } from "./DropdownSelector"
import SliderControl from "./SliderControl"
import TagSelector from "./TagSelector"
import ColorPaletteSelector from "./ColorPaletteSelector"
import { useDesignConfig } from "@/hooks/useDesignConfig"

// Mock data for the selectors
const roomTypes = [
  { id: "bedroom", label: "Bedroom", imageUrl: "/studio/bedroom-thumbnail.jpg" },
  { id: "living-room", label: "Living Room", imageUrl: "/studio/living-room-thumbnail.jpg" },
  { id: "kitchen", label: "Kitchen", imageUrl: "/studio/kitchen-thumbnail.jpg" },
  { id: "bathroom", label: "Bathroom", imageUrl: "/studio/bathroom-thumbnail.jpg" },
  { id: "office", label: "Office", imageUrl: "/studio/office-thumbnail.jpg" },
]

const designStyles = [
  { id: "modern", label: "Modern", imageUrl: "/studio/modern-thumbnail.jpg" },
  { id: "industrial", label: "Industrial", imageUrl: "/studio/industrial-thumbnail.jpg" },
  { id: "minimalist", label: "Minimalist", imageUrl: "/studio/minimalist-thumbnail.jpg" },
  { id: "scandinavian", label: "Scandinavian", imageUrl: "/studio/scandinavian-thumbnail.jpg" },
  { id: "bohemian", label: "Bohemian", imageUrl: "/studio/bohemian-thumbnail.jpg" },
]

const compositionOptions = [
  { value: "centered", label: "Centered" },
  { value: "rule-of-thirds", label: "Rule of Thirds" },
  { value: "diagonal", label: "Diagonal" },
  { value: "symmetrical", label: "Symmetrical" },
  { value: "asymmetrical", label: "Asymmetrical" },
]

const moodOptions = [
  { value: "calm", label: "Calm" },
  { value: "energetic", label: "Energetic" },
  { value: "cozy", label: "Cozy" },
  { value: "luxurious", label: "Luxurious" },
  { value: "minimalist", label: "Minimalist" },
]

const colorPalettes = [
  { id: "neutral", label: "Neutral", colors: ["#E8E4D9", "#D4C8BE", "#A69F98", "#474747"] },
  { id: "warm", label: "Warm", colors: ["#FCBA04", "#FF5C4D", "#D62839", "#7C3626"] },
  { id: "cool", label: "Cool", colors: ["#A0DDFF", "#758ECD", "#7D7ABC", "#C56183"] },
  { id: "earthy", label: "Earthy", colors: ["#5F7367", "#8BA888", "#BAA898", "#E5E0DC"] },
  { id: "monochrome", label: "Monochrome", colors: ["#FFFFFF", "#CCCCCC", "#888888", "#333333"] },
]

const lightingOptions = [
  { value: "natural", label: "Natural" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "dramatic", label: "Dramatic" },
  { value: "soft", label: "Soft" },
]

const materialOptions = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "glass", label: "Glass" },
  { value: "concrete", label: "Concrete" },
  { value: "fabric", label: "Fabric" },
  { value: "leather", label: "Leather" },
  { value: "marble", label: "Marble" },
]

interface DesignControlsPanelProps {
  designType?: "interior" | "exterior" | "landscape"
  onGenerateDesign?: (config: any) => void
}

export default function DesignControlsPanel({ designType = "interior", onGenerateDesign }: DesignControlsPanelProps) {
  const { config, updateConfig } = useDesignConfig()

  const handleGenerateDesign = () => {
    console.log("Current design configuration:", config)
    if (onGenerateDesign) {
      onGenerateDesign(config)
    }
  }

  return (
    <div className="flex flex-col space-y-6 w-full max-w-3xl mx-auto">
      {/* Room Type */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Room type</h3>
        <ImageSelector
          options={roomTypes}
          value={config?.roomType ?? null}
          onChange={(value) => updateConfig("roomType", value)}
        />
      </div>

      {/* Design Style */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Design style</h3>
        <ImageSelector
          options={designStyles}
          value={config?.designStyle ?? null}
          onChange={(value) => updateConfig("designStyle", value)}
        />
      </div>

      {/* Composition */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Composition</h3>
        <DropdownSelector
          options={compositionOptions}
          value={config?.composition ?? ""}
          onChange={(value) => updateConfig("composition", value)}
          placeholder="Select composition"
        />
      </div>

      {/* Mood */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Mood</h3>
        <DropdownSelector
          options={moodOptions}
          value={config?.mood ?? ""}
          onChange={(value) => updateConfig("mood", value)}
          placeholder="Select mood"
        />
      </div>

      {/* Color Palette */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Color palette</h3>
        <ColorPaletteSelector
          options={colorPalettes}
          value={config?.colorPalette ?? null}
          onChange={(value) => updateConfig("colorPalette", value)}
        />
      </div>

      {/* Lighting */}
      <div>
        <h3 className="text-sm font-medium mb-2 text-white">Lighting</h3>
        <DropdownSelector
          options={lightingOptions}
          value={config?.lighting ?? ""}
          onChange={(value) => updateConfig("lighting", value)}
          placeholder="Select lighting"
        />
      </div>

      {/* Materials */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Materials</h3>
        <TagSelector
          options={materialOptions}
          selectedValues={config?.materials || []}
          onChange={(values) => updateConfig("materials", values)}
          maxSelections={3}
        />
      </div>

      {/* Realism Slider */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Realism</h3>
        <SliderControl
          min={0}
          max={100}
          step={10}
          value={config?.realism || 50}
          onChange={(value) => updateConfig("realism", value)}
          labels={["Stylized", "Photorealistic"]}
        />
      </div>

      {/* Generate Button */}
      <div className="pt-4">
        <button
          onClick={handleGenerateDesign}
          className="w-full py-3 rounded-md bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Render design
        </button>
      </div>
    </div>
  )
}
