"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useLandscapeConfig } from "@/hooks/studio/useLandscapeConfig"
import { LandscapeConfig } from "@/types/studio"
import { 
  Trees, 
  Palette, 
  Sun, 
  Moon, 
  Image as ImageIcon
} from "lucide-react"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/Studio/FormSection"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { generateImageFromConfig } from "@/lib/api/generateImage"

const gardenTypeOptions = [
  { value: "Residential", label: "Residential" },
  { value: "Commercial", label: "Commercial" },
  { value: "Public", label: "Public" }
]

const styleOptions = [
  { value: "Modern", label: "Modern" },
  { value: "Traditional", label: "Traditional" },
  { value: "Japanese", label: "Japanese" },
  { value: "Mediterranean", label: "Mediterranean" }
]

const colorPaletteOptions = [
  { value: "Natural", label: "Natural" },
  { value: "Vibrant", label: "Vibrant" },
  { value: "Pastel", label: "Pastel" },
  { value: "Monochromatic", label: "Monochromatic" }
]

const lightingOptions = [
  { value: "Daylight", label: "Daylight" },
  { value: "Evening", label: "Evening" },
  { value: "Night", label: "Night" }
]

interface ImageState {
  file: File | null;
  previewUrl: string | null;
}

const defaultConfig: LandscapeConfig = {
  gardenType: "Residential",
  style: "Modern",
  colorPalette: "Natural",
  lighting: "Daylight",
  image: null,
  realism: 50
}

export default function LandscapeStudioPage() {
  const { config, updateConfig, resetConfig } = useLandscapeConfig()
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [realisticValue, setRealisticValue] = useState(50)
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    previewUrl: null
  })

  useEffect(() => {
    return () => {
      if (imageState.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
    };
  }, [imageState.previewUrl]);

  const handleConfigChange = (key: keyof LandscapeConfig, value: string | number | File | null) => {
    updateConfig({ [key]: value })
  }

  const handleImageUpload = (file: File, previewUrl: string) => {
    setImageState({ file, previewUrl });
    handleConfigChange("image", file);
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
      updateConfig({ [key]: defaultConfig[key as keyof LandscapeConfig] })
    }
  }

  const formContent = (
    <FormPanel>
      <div className="space-y-8">
        <FormSection title="Garden Type">
          <Select
            value={config.gardenType}
            onValueChange={(value) => handleConfigChange("gardenType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select garden type" />
            </SelectTrigger>
            <SelectContent>
              {gardenTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSection>

        <FormSection title="Style">
          <Select
            value={config.style}
            onValueChange={(value) => handleConfigChange("style", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {styleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSection>

        <FormSection title="Color Palette">
          <Select
            value={config.colorPalette}
            onValueChange={(value) => handleConfigChange("colorPalette", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select color palette" />
            </SelectTrigger>
            <SelectContent>
              {colorPaletteOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSection>

        <FormSection title="Lighting">
          <Select
            value={config.lighting}
            onValueChange={(value) => handleConfigChange("lighting", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select lighting" />
            </SelectTrigger>
            <SelectContent>
              {lightingOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormSection>

        <FormSection title="Reference Image">
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
                {imageState.previewUrl && (
                  <div className="mt-4">
                    <img
                      src={imageState.previewUrl}
                      alt="Preview"
                      className="max-h-48 rounded-lg object-cover"
                    />
                  </div>
                )}
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