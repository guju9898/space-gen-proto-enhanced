"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useExteriorConfig } from "@/hooks/studio/useExteriorConfig"
import { ExteriorConfig } from "@/types/studio"
import { 
  Building2, 
  Palette, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Camera,
  Layout,
  Star,
  Lightbulb
} from "lucide-react"
import { FormSection } from "@/components/Studio/FormSection"
import { DropdownSelector } from "@/components/Studio/Variables/DropdownSelector"
import { RenderButton } from "@/components/Studio/RenderButton"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { Button } from "@/components/ui/button"
import { generateImageFromConfig } from "@/lib/api/generateImage"

const buildingTypeOptions = [
  { value: "house", label: "House", icon: Building2 },
  { value: "apartment", label: "Apartment", icon: Building2 },
  { value: "commercial", label: "Commercial", icon: Building2 }
]

const architecturalStyleOptions = [
  { value: "modern", label: "Modern", icon: Layout },
  { value: "traditional", label: "Traditional", icon: Layout },
  { value: "contemporary", label: "Contemporary", icon: Layout }
]

const surroundingEnvironmentOptions = [
  { value: "urban", label: "Urban", icon: Building2 },
  { value: "suburban", label: "Suburban", icon: Building2 },
  { value: "rural", label: "Rural", icon: Building2 }
]

const defaultConfig: ExteriorConfig = {
  buildingType: "house",
  architecturalStyle: "modern",
  surroundingEnvironment: "urban",
  timeOfDay: "day",
  style: "modern",
  colorPalette: "neutral",
  lighting: "natural",
  image: null,
  realism: 50
}

// Add ImageState interface
interface ImageState {
  file: File | null;
  previewUrl: string | null;
}

export default function ExteriorClientPage() {
  if (typeof window === "undefined") return null;
  const { config, updateConfig, resetConfig } = useExteriorConfig()
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [realisticValue, setRealisticValue] = useState(50)
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    previewUrl: null
  })

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (imageState.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
    };
  }, [imageState.previewUrl]);

  if (!config) {
    return (
      <StudioLayout
        formContent={<div>Loading...</div>}
        previewContent={<div>Loading...</div>}
        requestContent={<div>Loading...</div>}
      />
    )
  }

  const handleConfigChange = (key: keyof ExteriorConfig) => (value: string | number | File | null) => {
    updateConfig({ [key]: value })
  }

  const handleImageUpload = (file: File, previewUrl: string) => {
    setImageState({ file, previewUrl });
    handleConfigChange("image")(file);
  }

  const handleRender = async () => {
    setIsRendering(true);
    try {
      const imageUrl = await generateImageFromConfig({
        ...config,
        image: imageState.file,
        realism: realisticValue
      });
      
      if (imageUrl) {
        setCurrentRender(imageUrl);
        setLatestRenders(prev => [imageUrl, ...prev].slice(0, 4));
      } else {
        console.error('Failed to generate image: No URL returned from API');
      }
    } catch (error) {
      console.error('Error rendering design:', error);
    } finally {
      setIsRendering(false);
    }
  };

  const handleThumbnailClick = (renderUrl: string) => {
    setCurrentRender(renderUrl)
  }

  const handleRemoveTag = (key: string) => {
    if (key in defaultConfig) {
      updateConfig({ [key]: defaultConfig[key as keyof ExteriorConfig] })
    }
  }

  const formContent = (
    <FormPanel>
      <div className="space-y-8">
        <FormSection title="Building Settings" icon={Building2}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Building Type
              </label>
              <DropdownSelector
                options={buildingTypeOptions}
                value={config.buildingType || ""}
                onChange={(value) => handleConfigChange("buildingType")(value)}
                placeholder="Select building type"
                icon={Building2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Architectural Style
              </label>
              <DropdownSelector
                options={architecturalStyleOptions}
                value={config.architecturalStyle || ""}
                onChange={(value) => handleConfigChange("architecturalStyle")(value)}
                placeholder="Select architectural style"
                icon={Layout}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Surrounding Environment
              </label>
              <DropdownSelector
                options={surroundingEnvironmentOptions}
                value={config.surroundingEnvironment || ""}
                onChange={(value) => handleConfigChange("surroundingEnvironment")(value)}
                placeholder="Select environment"
                icon={Building2}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Visual Preferences" icon={Camera}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Time of Day
              </label>
              <div className="flex space-x-4">
                <button
                  className={`flex-1 p-2 border rounded-md flex items-center justify-center space-x-2 ${
                    config.timeOfDay === "day" ? "bg-primary text-primary-foreground" : "bg-background"
                  }`}
                  onClick={() => handleConfigChange("timeOfDay")("day")}
                >
                  <Sun className="w-4 h-4" />
                  <span>Day</span>
                </button>
                <button
                  className={`flex-1 p-2 border rounded-md flex items-center justify-center space-x-2 ${
                    config.timeOfDay === "night" ? "bg-primary text-primary-foreground" : "bg-background"
                  }`}
                  onClick={() => handleConfigChange("timeOfDay")("night")}
                >
                  <Moon className="w-4 h-4" />
                  <span>Night</span>
                </button>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Reference Image" icon={ImageIcon}>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center transition-colors hover:border-muted-foreground/50">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (e) => {
                      handleImageUpload(file, e.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </div>
              </label>
            </div>
          </div>
        </FormSection>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Rendering Style
            </label>
            <RealisticSlider
              value={realisticValue}
              onChange={setRealisticValue}
            />
          </div>
          
          <div className="pt-4 border-t border-border">
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
              onClick={handleRender}
              disabled={isRendering}
            >
              {isRendering ? "Rendering..." : "Render Design"}
            </Button>
          </div>
        </div>
      </div>
    </FormPanel>
  )

  const previewContent = (
    <div className="bg-card rounded-lg border border-border p-6">
      <StudioPreview
        currentRender={currentRender}
        latestRenders={latestRenders}
        isRendering={isRendering}
        onThumbnailClick={handleThumbnailClick}
      />
    </div>
  )

  const requestContent = (
    <RequestSummary
      config={config}
      onRemove={handleRemoveTag}
      onClearAll={() => {
        resetConfig()
        setCurrentRender(null)
        setLatestRenders([])
      }}
    />
  )

  return (
    <StudioLayout
      formContent={formContent}
      previewContent={previewContent}
      requestContent={requestContent}
    />
  )
}

