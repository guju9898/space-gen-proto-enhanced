"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useDesignConfig } from "@/hooks/useDesignConfig"
import { LandscapeConfig } from "@/types/studio"
import { 
  Trees, 
  Palette, 
  Sun, 
  Moon, 
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FormSection } from "@/components/Studio/FormSection"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { VariableSelect } from "@/components/ui/VariableSelect"
import { FirstPaidSessionHint } from "@/components/Studio/FirstPaidSessionHint"
import { ImageOptionGrid } from "@/components/Studio/ImageOptionGrid"
import { GridPickerDialog } from "@/components/Studio/GridPickerDialog"
import { SegmentedToggle } from "@/components/Studio/SegmentedToggle"
import { buildGeminiPrompt } from "@/lib/api/buildGeminiPrompt"
import { cn } from "@/lib/utils"
import { landscapeDefaults } from "@/lib/studio/defaults"
import { isString } from "@/lib/types/typeGuards"
import { getCreditErrorMessage } from "@/lib/usage/errorMessages"
import { useAuth } from "@/components/auth/AuthContext"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

interface ImageState {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
}

export default function LandscapeStudioPage() {
  const { landscape, updateConfig, setActiveStudio } = useDesignConfig()
  const { status: authStatus, openLoginModal } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [realisticValue, setRealisticValue] = useState(50)
  const [imageState, setImageState] = useState<ImageState>({
    file: null,
    previewUrl: null,
    uploadedUrl: null
  })
  const [isUploading, setIsUploading] = useState(false)
  const [advancedControlsOpen, setAdvancedControlsOpen] = useState(false)
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null)

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    setActiveStudio("landscape")
    // Initialize state with default values to prevent hydration mismatch
    updateConfig(landscapeDefaults)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Cleanup preview URLs on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (imageState?.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
    };
  }, [imageState?.previewUrl]);

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

  const landscapeConfig = landscape

  if (!landscapeConfig) return null;

  const handleConfigChange = (key: keyof LandscapeConfig, value: string | number | File | null) => {
    updateConfig({ [key]: value })
  }

  const handleImageUpload = async (file: File, previewUrl: string) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
      setError("Please upload JPG, PNG, or WEBP images.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError("Image must be under 10MB.")
      return
    }
    setError(null)
    setIsUploading(true)
    try {
      const fileExt = file.name.split(".").pop() || "jpg"
      const fileName = `${Date.now()}.${fileExt}`
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage
        .from("reference-images")
        .upload(fileName, file)
      if (uploadError) throw uploadError
      const { data: publicUrlData } = supabase.storage
        .from("reference-images")
        .getPublicUrl(fileName)
      const imageUrl = publicUrlData.publicUrl
      if (!imageUrl?.startsWith("http")) throw new Error("Invalid upload URL")
      setImageState({ file, previewUrl, uploadedUrl: imageUrl })
      handleConfigChange("image", imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setImageState({ file: null, previewUrl: null, uploadedUrl: null })
      handleConfigChange("image", null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRender = async () => {
    if (authStatus === "initializing") {
      return
    }
    if (authStatus === "unauthenticated") {
      openLoginModal(pathname ?? "/studio/landscape")
      return
    }

    console.log('[GENERATOR] Using OpenRouter Nano Banana for landscape')
    setError(null)
    setIsRendering(true);
    try {
      // Generate unique render_id for idempotency
      const renderId = crypto.randomUUID()

      const renderConfig: Record<string, any> = {
        ...(landscapeConfig ?? {}),
        renderType: "landscape"
      }
      const finalPrompt = buildGeminiPrompt(renderConfig)
      
      const referenceImageUrl =
        imageState.uploadedUrl ??
        (isString(landscapeConfig?.image) && landscapeConfig.image.startsWith("http") ? landscapeConfig.image : null)

      const response = await fetch('/api/generate-openrouter', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          image: referenceImageUrl ?? null,
          renderType: "landscape",
          renderId: renderId,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error:', errorData)
        if (response.status === 401) {
          openLoginModal(pathname ?? '/studio/landscape')
          throw new Error('Please log in to generate images.')
        }
        const errorMessage =
          response.status === 402
            ? getCreditErrorMessage(errorData.error)
            : (errorData.error || 'Failed to generate image')
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const imageUrl = data.imageUrl
      
      // Update credits remaining from API response
      if (data.usage?.creditsRemaining !== undefined) {
        setCreditsRemaining(data.usage.creditsRemaining)
      }
      
      if (imageUrl) {
        setCurrentRender(imageUrl);
        setLatestRenders(prev => [imageUrl, ...prev].slice(0, 4));
      } else {
        console.error('Failed to generate image: No URL returned from API');
      }
    } catch (error) {
      console.error('Error rendering design:', error);
      setError(error instanceof Error ? error.message : 'Failed to render design')
    } finally {
      setIsRendering(false);
    }
  };

  const handleThumbnailClick = (renderUrl: string) => {
    setCurrentRender(renderUrl)
  }

  const handleRemoveTag = (key: string) => {
    if (key in landscapeDefaults) {
      const typedKey = key as keyof typeof landscapeDefaults
      updateConfig({
        [typedKey]: landscapeDefaults[typedKey]
      })
    }
  }

      const formContent = (
        <FormPanel>
          <div className="space-y-10">
            {/* Essential Controls - Always Visible */}
            <FormSection title="Project Basics">
              <div className="space-y-6">
                <div>
                  <GridPickerDialog
                    label="Garden Type"
                    value={landscapeConfig?.gardenType ?? landscapeDefaults.gardenType}
                    options={gardenTypeOptions.map(opt => ({
                      value: opt.value,
                      label: opt.label,
                      icon: Trees
                    }))}
                    placeholder="Select garden type"
                    onChange={(value) => handleConfigChange("gardenType", value)}
                  />
                </div>
                <div>
                  <VariableSelect
                    label="Theme Style"
                    value={landscapeConfig?.themeStyle ?? landscapeDefaults.style}
                    options={["zen", "tropical", "mediterranean", "cottage", "formal"]}
                    placeholder="Select or type theme style"
                    onChange={(value) => handleConfigChange("themeStyle", value)}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Lighting">
              <div className="space-y-6">
                <div>
                  <VariableSelect
                    label="Lighting"
                    value={landscapeConfig?.lighting ?? landscapeDefaults.lighting}
                    options={lightingOptions.map(opt => opt.value)}
                    placeholder="Select or type lighting"
                    onChange={(value) => handleConfigChange("lighting", value)}
                  />
                </div>
                <div>
                  <VariableSelect
                    label="Time of Day"
                    value={landscapeConfig?.timeOfDay ?? "morning"}
                    options={["morning", "afternoon", "evening", "night"]}
                    placeholder="Select time of day"
                    allowCustom={false}
                    onChange={(value) => handleConfigChange("timeOfDay", value)}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Hardscape & Water">
              <div className="space-y-6">
                <div>
                  <VariableSelect
                    label="Hardscaping"
                    value={landscapeConfig?.hardscaping ?? "pavers"}
                    options={["gravel", "pavers", "concrete", "stone", "wood deck"]}
                    placeholder="Select or type hardscaping"
                    onChange={(value) => handleConfigChange("hardscaping", value)}
                  />
                </div>
                <div>
                  <VariableSelect
                    label="Water Feature"
                    value={landscapeConfig?.waterFeature ?? "none"}
                    options={["fountain", "pond", "stream", "waterfall", "pool", "none"]}
                    placeholder="Select or type water feature"
                    onChange={(value) => handleConfigChange("waterFeature", value)}
                  />
                </div>
              </div>
            </FormSection>

            {/* Advanced (Optional) - Collapsed by Default */}
            <div className="border-t border-border pt-6">
              <button
                onClick={() => setAdvancedControlsOpen(!advancedControlsOpen)}
                className="w-full flex items-center justify-between text-left mb-2"
              >
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Advanced (Optional)</h3>
                </div>
                {advancedControlsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
                )}
              </button>
              <p className="text-xs text-muted-foreground/70 mb-4">Subtle refinements — defaults work well for most projects</p>
              
              {advancedControlsOpen && (
                <div className="space-y-10 mt-4 opacity-90 animate-in fade-in-0 duration-150">
                  <FormSection title="Planting">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Plant Types"
                          value={landscapeConfig?.plantTypes ?? ""}
                          options={["succulents", "trees", "shrubs", "flowers", "grasses", "vines"]}
                          placeholder="Select or type plant types"
                          onChange={(value) => handleConfigChange("plantTypes", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Planting Density"
                          value={landscapeConfig?.plantingDensity?.toString() ?? ""}
                          options={["0", "25", "50", "75", "100"]}
                          placeholder="Select planting density"
                          allowCustom={false}
                          onChange={(value) => handleConfigChange("plantingDensity", value ? parseInt(value, 10) : null)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Topography">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Topography"
                          value={landscapeConfig?.topography ?? ""}
                          options={["flat", "sloped", "terraced", "hilly"]}
                          placeholder="Select or type topography"
                          onChange={(value) => handleConfigChange("topography", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Furniture & Structures">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Outdoor Furniture"
                          value={landscapeConfig?.outdoorFurniture ?? ""}
                          options={["bench", "outdoor sofa", "dining set", "hammock", "none"]}
                          placeholder="Select or type outdoor furniture"
                          onChange={(value) => handleConfigChange("outdoorFurniture", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Seating Feature"
                          value={landscapeConfig?.seatingFeature ?? ""}
                          options={["bench", "outdoor-sofa", "dining-set", "hammock", "swing", "none"]}
                          placeholder="Select or type seating feature"
                          onChange={(value) => handleConfigChange("seatingFeature", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Structures"
                          value={landscapeConfig?.structures ?? ""}
                          options={["pergola", "gazebo", "arbor", "trellis", "none"]}
                          placeholder="Select or type structures"
                          onChange={(value) => handleConfigChange("structures", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Lighting Details">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Lighting Intensity"
                          value={landscapeConfig?.lightingIntensity?.toString() ?? ""}
                          options={["0", "25", "50", "75", "100"]}
                          placeholder="Select lighting intensity"
                          allowCustom={false}
                          onChange={(value) => handleConfigChange("lightingIntensity", value ? parseInt(value, 10) : null)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Furniture & Structures">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Outdoor Furniture"
                          value={landscapeConfig?.outdoorFurniture ?? ""}
                          options={["bench", "outdoor sofa", "dining set", "hammock", "none"]}
                          placeholder="Select or type outdoor furniture"
                          onChange={(value) => handleConfigChange("outdoorFurniture", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Seating Feature"
                          value={landscapeConfig?.seatingFeature ?? ""}
                          options={["bench", "outdoor-sofa", "dining-set", "hammock", "swing", "none"]}
                          placeholder="Select or type seating feature"
                          onChange={(value) => handleConfigChange("seatingFeature", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Structures"
                          value={landscapeConfig?.structures ?? ""}
                          options={["pergola", "gazebo", "arbor", "trellis", "none"]}
                          placeholder="Select or type structures"
                          onChange={(value) => handleConfigChange("structures", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Activity & Interaction">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Play Activity Area"
                          value={landscapeConfig?.playActivityArea ?? ""}
                          options={["playground", "sports court", "none"]}
                          placeholder="Select or type play activity area"
                          onChange={(value) => handleConfigChange("playActivityArea", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Interactive Elements"
                          value={landscapeConfig?.interactiveElements ?? ""}
                          options={["stepping stones", "pathway", "bridge", "none"]}
                          placeholder="Select or type interactive elements"
                          onChange={(value) => handleConfigChange("interactiveElements", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Materials">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Wall Materials"
                          value={landscapeConfig?.wallMaterials ?? ""}
                          options={["stone", "brick", "wood", "concrete", "none"]}
                          placeholder="Select or type wall materials"
                          onChange={(value) => handleConfigChange("wallMaterials", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Environment / Climate">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Climate Zone"
                          value={landscapeConfig?.climateZone ?? ""}
                          options={["temperate", "tropical", "arid", "continental"]}
                          placeholder="Select or type climate zone"
                          onChange={(value) => handleConfigChange("climateZone", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Weather"
                          value={landscapeConfig?.weather ?? ""}
                          options={["sunny", "cloudy", "rainy", "foggy"]}
                          placeholder="Select or type weather"
                          onChange={(value) => handleConfigChange("weather", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Visual Framing">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Scale"
                          value={landscapeConfig?.scale ?? ""}
                          options={["human", "grand", "intimate"]}
                          placeholder="Select or type scale"
                          onChange={(value) => handleConfigChange("scale", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Geometry"
                          value={landscapeConfig?.geometry ?? ""}
                          options={["rectangular", "square", "circular", "l-shaped", "u-shaped"]}
                          placeholder="Select geometry"
                          allowCustom={false}
                          onChange={(value) => handleConfigChange("geometry", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Garden Geometry"
                          value={landscapeConfig?.gardenGeometry ?? ""}
                          options={["rectangular", "square", "circular", "l-shaped", "u-shaped"]}
                          placeholder="Select garden geometry"
                          allowCustom={false}
                          onChange={(value) => handleConfigChange("gardenGeometry", value)}
                        />
                      </div>
                      <div>
                        <VariableSelect
                          label="Camera Angle"
                          value={landscapeConfig?.cameraAngle ?? ""}
                          options={["eye level", "high angle", "low angle", "bird's eye", "worm's eye", "overhead"]}
                          placeholder="Select or type camera angle"
                          onChange={(value) => handleConfigChange("cameraAngle", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  <FormSection title="Nature">
                    <div className="space-y-6">
                      <div>
                        <VariableSelect
                          label="Wildlife Elements"
                          value={landscapeConfig?.wildlifeElements ?? ""}
                          options={["birds", "butterflies", "none"]}
                          placeholder="Select or type wildlife elements"
                          onChange={(value) => handleConfigChange("wildlifeElements", value)}
                        />
                      </div>
                    </div>
                  </FormSection>

                  {/* Advanced Controls - Architect, Lens, etc. */}
                  <div className="border-t border-border pt-6">
                    <div className="space-y-4 opacity-90">
                      {/* Architect Influence */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Architect Influence
                          </label>
                          <div className="group relative">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border border-border rounded-md text-xs text-muted-foreground z-10">
                              A subtle architectural influence used to refine proportions and detailing. This does not change the selected style.
                            </div>
                          </div>
                        </div>
                        <VariableSelect
                          value={landscapeConfig?.advanced?.architectInfluence ?? "none"}
                          options={["none", "foster", "gehry", "calatrava", "hadid", "koolhaas"]}
                          placeholder="Select architect influence"
                          allowCustom={false}
                          onChange={(value) => updateConfig({ 
                            advanced: { 
                              ...(landscapeConfig?.advanced || {}), 
                              architectInfluence: value 
                            } 
                          })}
                        />
                      </div>

                      {/* Lens */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Lens
                          </label>
                          <div className="group relative">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border border-border rounded-md text-xs text-muted-foreground z-10">
                              Simulates real-world camera lenses to affect depth and perspective. Moderate lenses produce the most natural results.
                            </div>
                          </div>
                        </div>
                        <VariableSelect
                          value={landscapeConfig?.advanced?.lens ?? "standard"}
                          options={["standard", "wide", "telephoto", "fisheye", "ultra-wide"]}
                          placeholder="Select lens"
                          allowCustom={false}
                          onChange={(value) => updateConfig({ 
                            advanced: { 
                              ...(landscapeConfig?.advanced || {}), 
                              lens: value 
                            } 
                          })}
                        />
                        {(landscapeConfig?.advanced?.lens === "fisheye" || landscapeConfig?.advanced?.lens === "ultra-wide") && (
                          <p className="mt-1 text-xs text-muted-foreground/70">Extreme lenses may exaggerate space.</p>
                        )}
                      </div>

                      {/* Geometry */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Geometry
                          </label>
                          <div className="group relative">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border border-border rounded-md text-xs text-muted-foreground z-10">
                              Guides the overall form language of the design. Geometry refines form, not layout.
                            </div>
                          </div>
                        </div>
                        <VariableSelect
                          value={landscapeConfig?.advanced?.geometry ?? "balanced"}
                          options={["balanced", "rectangular", "curved", "angular", "organic"]}
                          placeholder="Select geometry"
                          allowCustom={false}
                          onChange={(value) => updateConfig({ 
                            advanced: { 
                              ...(landscapeConfig?.advanced || {}), 
                              geometry: value 
                            } 
                          })}
                        />
                      </div>

                      {/* Symmetry */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Symmetry
                          </label>
                          <div className="group relative">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border border-border rounded-md text-xs text-muted-foreground z-10">
                              Adjusts how balanced or asymmetrical the composition feels. Subtle symmetry often produces the most natural results.
                            </div>
                          </div>
                        </div>
                        <VariableSelect
                          value={landscapeConfig?.advanced?.symmetry ?? "subtle"}
                          options={["subtle", "balanced", "asymmetrical", "symmetrical"]}
                          placeholder="Select symmetry"
                          allowCustom={false}
                          onChange={(value) => updateConfig({ 
                            advanced: { 
                              ...(landscapeConfig?.advanced || {}), 
                              symmetry: value 
                            } 
                          })}
                        />
                      </div>

                      {/* Mood & Atmosphere */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <label className="text-sm font-medium text-muted-foreground">
                            Mood & Atmosphere
                          </label>
                          <div className="group relative">
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/60" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-popover border border-border rounded-md text-xs text-muted-foreground z-10">
                              Sets the emotional tone using light, contrast, and environment. Mood enhances the design without overpowering it.
                            </div>
                          </div>
                        </div>
                        <VariableSelect
                          value={landscapeConfig?.advanced?.mood ?? "neutral"}
                          options={["neutral", "calm", "dramatic", "serene", "energetic"]}
                          placeholder="Select mood"
                          allowCustom={false}
                          onChange={(value) => updateConfig({ 
                            advanced: { 
                              ...(landscapeConfig?.advanced || {}), 
                              mood: value 
                            } 
                          })}
                        />
                        {landscapeConfig?.advanced?.mood === "dramatic" && (
                          <p className="mt-1 text-xs text-muted-foreground/70">Intense moods work best with simple materials.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <FormSection title="Reference Image (Optional)">
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground mb-2">
              Upload JPG, PNG, or WEBP under 10MB. Higher resolution produces better results.
            </p>
            <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isUploading ? "cursor-wait opacity-70 border-muted" : "hover:border-muted-foreground/50 border-border"}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={isUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = (ev) => {
                      handleImageUpload(file, ev.target?.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                  e.target.value = ""
                }}
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className={isUploading ? "cursor-wait flex flex-col items-center space-y-2" : "cursor-pointer flex flex-col items-center space-y-2"}
              >
                <div className="p-3 rounded-full bg-muted">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{isUploading ? "Uploading..." : "Click to upload"}</p>
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
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Supported formats: JPG, PNG, WEBP</p>
              <p>Max size: 10MB</p>
              <p>Higher resolution images produce better results.</p>
              <p>Avoid blurry, dark, or heavily compressed images.</p>
            </div>
          </div>
            </FormSection>

            <div className="space-y-6">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">
              Rendering Style
            </label>
            <RealisticSlider
              value={landscapeConfig?.realism ?? landscapeDefaults.realism}
              onChange={(value) => handleConfigChange("realism", value)}
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
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
              This render uses {imageState.uploadedUrl || (isString(landscapeConfig?.image) && landscapeConfig.image.startsWith("http")) ? "1.5" : "1.0"} credits
            </div>
            <div className="text-xs text-muted-foreground italic">
              Credits are only deducted after a successful render appears.
            </div>
          </div>

          <FirstPaidSessionHint className="mt-4" />
          <div className="pt-4 border-t border-border">
            <Button 
              className={cn(
                "w-full bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium",
                "transition-all duration-150 ease-out",
                "hover:bg-primary/90 hover:shadow-md hover:shadow-primary/20",
                "active:scale-[0.98]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none",
                isRendering && "cursor-wait"
              )}
              onClick={() => handleRender()}
              disabled={authStatus === "initializing" || isRendering}
            >
              {authStatus === "initializing"
                ? "Checking..."
                : isRendering
                  ? "Rendering..."
                  : "Render Design"}
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
      config={landscapeConfig ?? undefined}
      onRemove={handleRemoveTag}
      onClearAll={() => {
        updateConfig(landscapeDefaults)
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
