"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useInteriorConfig } from "@/hooks/useDesignConfig"
import { InteriorConfig } from "@/types/studio"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { Button } from "@/components/ui/button"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { ImageUpload } from "@/components/Studio/ImageUpload"
import { FirstPaidSessionHint } from "@/components/Studio/FirstPaidSessionHint"
import { isString } from "@/lib/types/typeGuards"
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
  Lightbulb,
  ChevronDown
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
import { ImageOptionGrid } from "@/components/Studio/ImageOptionGrid"
import { GridPickerDialog } from "@/components/Studio/GridPickerDialog"
import { SegmentedToggle } from "@/components/Studio/SegmentedToggle"
import { VariableSelect } from "@/components/ui/VariableSelect"
import { buildPrompt } from "@/lib/api/generateImage"
import { cn } from "@/lib/utils"
import { interiorDefaults } from "@/lib/studio/defaults"
import { getCreditErrorMessage } from "@/lib/usage/errorMessages"

interface ImageState {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null; // Supabase Storage public URL
}

export default function InteriorStudioPage() {
  const { config, updateConfig } = useInteriorConfig()
  const [mounted, setMounted] = useState(false)
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    // Initialize state with default values to prevent hydration mismatch
    updateConfig(interiorDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup preview URLs on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (imageState?.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl)
      }
    }
  }, [imageState?.previewUrl])

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
  if (!config) return null;

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

      // Upload to Supabase Storage via API route
      setError(null)
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json()
        throw new Error(err.error || "Failed to upload image")
      }

      const uploadData = await uploadResponse.json()
      const uploadedUrl = uploadData.imageUrl

      if (!uploadedUrl || !uploadedUrl.startsWith("http")) {
        throw new Error("Invalid image URL returned from upload")
      }

      // Store file, preview, and uploaded URL
      setImageState({ file, previewUrl, uploadedUrl })
      handleConfigChange("image", uploadedUrl)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setImageState(null)
      handleConfigChange("image", null)
    }
  }

  const handleGenerate = async (config: Record<string, any>) => {
    // Frontend guard: Interior Studio requires a reference image URL
    const imageUrl = imageState?.uploadedUrl || (isString(config.image) && 
      config.image.startsWith("http") ? config.image : null)
    
    if (!imageUrl || !imageUrl.startsWith("http")) {
      setError("Upload a room photo to generate.")
      return
    }

    setError(null)
    setIsRendering(true);

    try {
      // Generate unique render_id for idempotency
      const renderId = crypto.randomUUID()

      // Build prompt using existing function
      const finalPrompt = buildPrompt(config);

      const response = await fetch("/api/generate-replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          imageUrl: imageUrl,
          realism: config.realism ?? 50,
          renderId: renderId,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        // Map API error codes to user-friendly messages
        const errorMessage = response.status === 402 
          ? getCreditErrorMessage(err.error)
          : (err.error || "Interior generation failed")
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const generatedImageUrl = data.imageUrl
      
      // Update credits remaining from API response
      if (data.usage?.creditsRemaining !== undefined) {
        setCreditsRemaining(data.usage.creditsRemaining)
      }
      
      if (generatedImageUrl) {
        console.log("✅ Image generated:", generatedImageUrl);
        setCurrentRender(generatedImageUrl);
        setLatestRenders(prev => [generatedImageUrl, ...prev].slice(0, 4));
      } else {
        console.error('Failed to generate image: No URL returned from API');
      }
    } catch (error) {
      console.error("❌ Generation error:", error);
      setError(error instanceof Error ? error.message : "Interior generation failed")
    }

    setIsRendering(false);
  };

  const handleThumbnailClick = (renderUrl: string) => {
    setCurrentRender(renderUrl)
  }

  const handleRemoveTag = (key: string) => {
    if (key in interiorDefaults) {
      const typedKey = key as keyof typeof interiorDefaults
      updateConfig({
        [typedKey]: interiorDefaults[typedKey]
      })
    }
  }

  const formContent = (
    <FormPanel>
      <div className="space-y-10">
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <FormSection title="Room Settings" icon={Layout}>
          <div className="space-y-6">
            <div>
              <ImageOptionGrid
                label="Room Type"
                value={config?.roomType ?? interiorDefaults.roomType}
                options={roomTypes.map(type => ({
                  value: type.value,
                  label: type.label,
                  icon: type.icon
                }))}
                placeholder="Select room type"
                onChange={(value) => handleConfigChange("roomType", value)}
              />
            </div>
            <div>
              <ImageOptionGrid
                label="Design Style"
                value={config?.designStyle ?? interiorDefaults.designStyle}
                options={designStyles.map(style => ({
                  value: style.value,
                  label: style.label,
                  icon: style.icon
                }))}
                placeholder="Select design style"
                onChange={(value) => handleConfigChange("designStyle", value)}
              />
            </div>
            <div>
              <VariableSelect
                label="Typology"
                value={config?.typology ?? interiorDefaults.typology}
                options={typologies.map(opt => opt.value)}
                placeholder="Select or type typology"
                onChange={(value) => handleConfigChange("typology", value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Visual Composition" icon={Camera}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Lens"
                value={config?.lens ?? interiorDefaults.lens}
                options={lenses.map(opt => opt.value)}
                placeholder="Select or type lens"
                onChange={(value) => handleConfigChange("lens", value)}
              />
            </div>
          </div>
        </FormSection>

        <div className="space-y-4">
          <button
            onClick={() => setIsDetailsOpen(!isDetailsOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-md border border-border bg-card hover:bg-accent/50 transition-colors"
          >
            <span className="text-sm font-medium">Design Details (Optional)</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isDetailsOpen && "rotate-180"
              )}
            />
          </button>
          {isDetailsOpen && (
            <div className="space-y-6 pl-4 border-l-2 border-border">
              <div>
                <VariableSelect
                  label="Room Layout"
                  value={config?.roomLayout ?? ""}
                  options={["open", "closed", "semi-open", "split", "studio", "loft"]}
                  placeholder="Select or type room layout"
                  onChange={(value) => handleConfigChange("roomLayout", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Camera Angle"
                  value={config?.cameraAngle ?? ""}
                  options={["eye level", "high angle", "low angle", "bird's eye", "worm's eye", "overhead"]}
                  placeholder="Select or type camera angle"
                  onChange={(value) => handleConfigChange("cameraAngle", value)}
                />
              </div>
              <div>
                <ImageOptionGrid
                  label="View Type"
                  value={config?.viewType ?? ""}
                  options={[
                    { value: "corner", label: "Corner", icon: Camera },
                    { value: "straight-on", label: "Straight-On", icon: Camera },
                    { value: "diagonal", label: "Diagonal", icon: Camera },
                    { value: "panoramic", label: "Panoramic", icon: Camera },
                  ]}
                  placeholder="Select view type"
                  onChange={(value) => handleConfigChange("viewType", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Composition Style"
                  value={config?.compositionStyle ?? ""}
                  options={["symmetrical", "asymmetrical", "rule of thirds", "centered", "off-center"]}
                  placeholder="Select or type composition style"
                  onChange={(value) => handleConfigChange("compositionStyle", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Focal Point"
                  value={config?.focalPoint ?? ""}
                  options={["fireplace", "window", "artwork", "furniture", "architectural feature", "center", "off-center"]}
                  placeholder="Select or type focal point"
                  onChange={(value) => handleConfigChange("focalPoint", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Framing"
                  value={config?.framing ?? ""}
                  options={["doorway", "window", "archway", "columns", "none"]}
                  placeholder="Select or type framing elements"
                  onChange={(value) => handleConfigChange("framing", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Negative Space"
                  value={config?.negativeSpace ?? ""}
                  options={["minimal", "moderate", "extensive", "none"]}
                  placeholder="Select or type negative space level"
                  onChange={(value) => handleConfigChange("negativeSpace", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Patterns & Repetition"
                  value={config?.patternsRepetition ?? ""}
                  options={["geometric", "organic", "textile", "architectural", "none"]}
                  placeholder="Select or type pattern style"
                  onChange={(value) => handleConfigChange("patternsRepetition", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Symmetry Level"
                  value={config?.symmetryLevel?.toString() ?? ""}
                  options={["0", "25", "50", "75", "100"]}
                  placeholder="Select symmetry level"
                  allowCustom={false}
                  onChange={(value) => handleConfigChange("symmetryLevel", value ? parseInt(value, 10) : null)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Material Focus"
                  value={config?.flooring ?? ""}
                  options={["hardwood", "tile", "carpet", "concrete", "marble", "laminate", "vinyl"]}
                  placeholder="Select or type material focus"
                  onChange={(value) => handleConfigChange("flooring", value)}
                />
              </div>
              <div>
                <VariableSelect
                  label="Textures"
                  value={config?.textures ?? ""}
                  options={["smooth", "rough", "textured", "glossy", "matte", "natural"]}
                  placeholder="Select or type texture style"
                  onChange={(value) => handleConfigChange("textures", value)}
                />
              </div>
            </div>
          )}
        </div>

        <FormSection title="Materials & Textures" icon={Star}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Color Palette"
                value={config?.colorPalette ?? interiorDefaults.colorPalette}
                options={colorPalettes.map(opt => opt.value)}
                placeholder="Select or type color palette"
                onChange={(value) => handleConfigChange("colorPalette", value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Lighting & Atmosphere" icon={Lightbulb}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Lighting Type"
                value={config?.lighting ?? interiorDefaults.lighting}
                options={lightingOptions.map(opt => opt.value)}
                placeholder="Select or type lighting"
                onChange={(value) => handleConfigChange("lighting", value)}
              />
            </div>
            <div>
              <SegmentedToggle
                label="Time of Day"
                value={config?.timeOfDay ?? interiorDefaults.timeOfDay}
                options={timeOfDayOptions.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                  icon: opt.icon
                }))}
                onChange={(value) => handleConfigChange("timeOfDay", value)}
              />
            </div>
            <div>
              <VariableSelect
                label="Mood / Atmosphere"
                value={config?.mood ?? interiorDefaults.mood}
                options={moodOptions.map(opt => opt.value)}
                placeholder="Select or type mood"
                onChange={(value) => handleConfigChange("mood", value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Architectural Details" icon={Building}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Architect"
                value={config?.architect ?? interiorDefaults.architect}
                options={architects.map(opt => opt.value)}
                placeholder="Select architect"
                allowCustom={false}
                onChange={(value) => handleConfigChange("architect", value)}
              />
            </div>
            <div>
              <VariableSelect
                label="Geometry"
                value={config?.geometry ?? interiorDefaults.geometry}
                options={geometries.map(opt => opt.value)}
                placeholder="Select geometry"
                allowCustom={false}
                onChange={(value) => handleConfigChange("geometry", value)}
              />
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
              value={config?.realism ?? interiorDefaults.realism}
              onChange={(value) => handleConfigChange("realism", value)}
            />
          </div>
          
          {error && (
            <div className="pt-2 text-sm text-destructive">
              {error}
            </div>
          )}
          
          {/* Credits Display */}
          <div className="pt-4 space-y-2">
            {creditsRemaining !== null && (
              <div className="text-sm text-muted-foreground">
                Credits remaining: <span className="font-medium text-foreground">{creditsRemaining}</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              This render uses 1.0 credits
            </div>
            <div className="text-xs text-muted-foreground italic">
              Credits are only deducted after a successful render appears.
            </div>
          </div>

          <FirstPaidSessionHint className="mt-4" />
          <div className="pt-4 border-t border-border">
            <Button 
              className={cn(
                "w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium",
                "transition-all duration-150 ease-out",
                "hover:shadow-md hover:shadow-primary/20",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                isRendering && "cursor-wait"
              )}
              onClick={() => handleGenerate(config)}
              disabled={isRendering || !(imageState?.uploadedUrl || (isString(config.image) && 
                config.image.startsWith("http")))}
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
      config={config ?? undefined}
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
