"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useInteriorConfig } from "@/hooks/useDesignConfig"
import { InteriorConfig } from "@/types/studio"
import { DropdownSelector } from "@/components/Studio/Variables/DropdownSelector"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { Button } from "@/components/ui/button"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { ImageUpload } from "@/components/Studio/ImageUpload"
import { 
  Home, 
  Palette, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  Smile,
  HelpCircle,
  Camera,
  Layout,
  Square,
  Star,
  Layers,
  Building2,
  CameraIcon,
  LayoutGrid,
  Box,
  Clock,
  Building,
  User,
  Lightbulb
} from "lucide-react"
import { FormSection } from "@/components/Studio/FormSection"
import {
  roomTypes,
  designStyles,
  colorPalettes,
  lightingOptions,
  timeOfDayOptions,
  moodOptions,
  architects,
  lenses,
  typologies,
  geometries
} from "@/lib/studio/variables"
import { generateImageFromConfig } from "@/lib/api/generateImage"

const defaultConfig: InteriorConfig = {
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
}

interface ImageState {
  file: File | null;
  previewUrl: string | null;
}

export default function InteriorStudioPage() {
  const { config, updateConfig } = useInteriorConfig()
  const [mounted, setMounted] = useState(false)
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState | null>(null)

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    // Initialize state with default values to prevent hydration mismatch
    updateConfig(defaultConfig)
    return () => {
      // Cleanup any existing image previews
      if (imageState && imageState.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl)
      }
    }
  }, [])

  // Early return during SSR
  if (!mounted) {
    return (
      <StudioLayout
        formContent={<FormPanel><div className="h-[800px]" /></FormPanel>}
        previewContent={<div className="h-[600px]" />}
        requestContent={<div className="h-[100px]" />}
      />
    )
  }

  const handleConfigChange = (key: keyof InteriorConfig, value: string | number | File | null) => {
    setError(null) // Clear any previous errors
    updateConfig({ [key]: value })
  }

  const handleImageUpload = async (file: File, previewUrl: string) => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file')
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size should be less than 10MB')
      }

      // Clean up previous preview URL if it exists
      if (imageState && imageState.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl)
      }

      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setImageState({ file, previewUrl })
      handleConfigChange("image", base64)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setImageState(null)
      handleConfigChange("image", null)
    }
  }

  const handleGenerate = async (config: Record<string, any>) => {
    setIsRendering(true);

    try {
      // Sanitize invalid string-based image URLs before API call
      if (
        config.image &&
        typeof config.image === "string" &&
        !config.image.startsWith("http")
      ) {
        console.warn("⚠️ Ignoring invalid image string:", config.image);
        config.image = null;
      }

      const imageUrl = await generateImageFromConfig(config);

      if (imageUrl) {
        console.log("✅ Image generated:", imageUrl);
        setCurrentRender(imageUrl);
      } else {
        console.warn("⚠️ Image generation returned null or failed.");
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
    }

    setIsRendering(false);
  };

  const handleThumbnailClick = (renderUrl: string) => {
    setCurrentRender(renderUrl)
  }

  const handleRemoveTag = (key: string) => {
    if (key in defaultConfig) {
      updateConfig({ [key]: defaultConfig[key as keyof InteriorConfig] })
    }
  }

  const formContent = (
    <FormPanel>
      <div className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <FormSection title="Room Settings" icon={Layout}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Room Type</label>
              <select
                className="w-full mt-1"
                value={config.roomType}
                onChange={(e) => handleConfigChange("roomType", e.target.value)}
              >
                {roomTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Design Style</label>
              <select
                className="w-full mt-1"
                value={config.designStyle}
                onChange={(e) => handleConfigChange("designStyle", e.target.value)}
              >
                {designStyles.map(style => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Visual Composition" icon={Camera}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Camera Angle</label>
              <select
                className="w-full mt-1"
                value={config.lens}
                onChange={(e) => handleConfigChange("lens", e.target.value)}
              >
                {lenses.map(angle => (
                  <option key={angle.value} value={angle.value}>
                    {angle.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Room Layout</label>
              <select
                className="w-full mt-1"
                value={config.typology}
                onChange={(e) => handleConfigChange("typology", e.target.value)}
              >
                {typologies.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Materials & Textures" icon={Star}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Color Palette</label>
              <select
                className="w-full mt-1"
                value={config.colorPalette}
                onChange={(e) => handleConfigChange("colorPalette", e.target.value)}
              >
                {colorPalettes.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Lighting & Atmosphere" icon={Lightbulb}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Lighting</label>
              <select
                className="w-full mt-1"
                value={config.lighting}
                onChange={(e) => handleConfigChange("lighting", e.target.value)}
              >
                {lightingOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Time of Day</label>
              <select
                className="w-full mt-1"
                value={config.timeOfDay}
                onChange={(e) => handleConfigChange("timeOfDay", e.target.value)}
              >
                {timeOfDayOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Mood</label>
              <select
                className="w-full mt-1"
                value={config.mood}
                onChange={(e) => handleConfigChange("mood", e.target.value)}
              >
                {moodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Architectural Details" icon={Building}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Architect</label>
              <select
                className="w-full mt-1"
                value={config.architect}
                onChange={(e) => handleConfigChange("architect", e.target.value)}
              >
                {architects.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Geometry</label>
              <select
                className="w-full mt-1"
                value={config.geometry}
                onChange={(e) => handleConfigChange("geometry", e.target.value)}
              >
                {geometries.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Reference Image" icon={ImageIcon}>
          <ImageUpload 
            onUpload={handleImageUpload}
            currentPreview={imageState?.previewUrl}
            accept="image/*"
            maxSize={10 * 1024 * 1024}
          />
        </FormSection>

        <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Rendering Style
            </label>
            <RealisticSlider
              value={config.realism}
              onChange={(value) => handleConfigChange("realism", value)}
            />
          </div>
          
          <div className="pt-4 border-t border-border">
            <Button 
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
              onClick={() => handleGenerate(config)}
              disabled={isRendering}
            >
              {isRendering ? "Generating..." : "Generate"}
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