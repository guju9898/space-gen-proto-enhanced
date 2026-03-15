"use client"

import { useState, useEffect } from "react"
import { StudioLayout } from "@/components/Studio/StudioLayout"
import { FormPanel } from "@/components/Studio/FormPanel"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { useDesignConfig } from "@/hooks/useDesignConfig"
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
  Lightbulb,
  Layers,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react"
import { FormSection } from "@/components/Studio/FormSection"
import { RenderButton } from "@/components/Studio/RenderButton"
import { RealisticSlider } from "@/components/Studio/Variables/RealisticSlider"
import { StudioPreview } from "@/components/Studio/StudioPreview"
import { Button } from "@/components/ui/button"
import { FirstPaidSessionHint } from "@/components/Studio/FirstPaidSessionHint"
import { VariableSelect } from "@/components/ui/VariableSelect"
import { isString } from "@/lib/types/typeGuards"
import { ImageOptionGrid } from "@/components/Studio/ImageOptionGrid"
import { GridPickerDialog } from "@/components/Studio/GridPickerDialog"
import { SegmentedToggle } from "@/components/Studio/SegmentedToggle"
import { buildGeminiPrompt } from "@/lib/api/buildGeminiPrompt"
import { cn } from "@/lib/utils"
import { exteriorDefaults } from "@/lib/studio/defaults"
import { getCreditErrorMessage } from "@/lib/usage/errorMessages"
import { useAuth } from "@/components/auth/AuthContext"
import { usePathname, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { DemoEmailGate } from "@/components/demo/DemoEmailGate"
import { DemoLimitModal } from "@/components/demo/DemoLimitModal"
import { COOKIE_NAME, DEMO_EMAIL_COOKIE } from "@/lib/demo/usage"
import { RenderActionsBar } from "@/components/Studio/RenderActionsBar"
import { SaveToProjectDialog } from "@/components/Studio/projects/SaveToProjectDialog"
import { ShareProjectDialog } from "@/components/Studio/projects/ShareProjectDialog"
import { CreateMockupDialog } from "@/components/Studio/projects/CreateMockupDialog"
import { downloadImage } from "@/lib/projects/utils"
import { enableProjectShare, disableProjectShare } from "@/app/studio/projects/actions"
import type { Project } from "@/lib/projects/types"

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

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
const MAX_IMAGE_SIZE = 10 * 1024 * 1024

interface ImageState {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null;
}

export default function ExteriorStudioPage() {
  const searchParams = useSearchParams()
  const demoMode = searchParams.get("demo") === "true"
  const { exterior, updateConfig, setActiveStudio } = useDesignConfig()
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
  const [demoEmail, setDemoEmail] = useState<string | null>(null)
  const [showEmailGate, setShowEmailGate] = useState(false)
  const [rendersRemaining, setRendersRemaining] = useState<number>(5)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [lastSavedProject, setLastSavedProject] = useState<Project | null>(null)
  const [lastSavedRenderId, setLastSavedRenderId] = useState<string | null>(null)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [shareProject, setShareProject] = useState<Project | null>(null)
  const [mockupDialogOpen, setMockupDialogOpen] = useState(false)

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    setActiveStudio("exterior")
    updateConfig(exteriorDefaults)
    // Restore demo email from cookie if present
    if (typeof document !== "undefined") {
      const match = document.cookie.match(new RegExp(`${DEMO_EMAIL_COOKIE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]+)`))
      if (match) {
        try {
          const email = decodeURIComponent(match[1].trim())
          if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) setDemoEmail(email)
        } catch (_) {}
      }
      const saved = sessionStorage.getItem("renderspace_demo_renders")
      if (saved) {
        try {
          const { current, latest } = JSON.parse(saved) as { current?: string; latest?: string[] }
          if (current) setCurrentRender(current)
          if (Array.isArray(latest) && latest.length) setLatestRenders(latest)
        } catch (_) {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persist demo renders to sessionStorage so they survive navigation to onboarding
  useEffect(() => {
    if (!demoMode || typeof sessionStorage === "undefined") return
    sessionStorage.setItem(
      "renderspace_demo_renders",
      JSON.stringify({ current: currentRender, latest: latestRenders })
    )
  }, [demoMode, currentRender, latestRenders])

  // Cleanup preview URLs on unmount or when previewUrl changes
  useEffect(() => {
    return () => {
      if (imageState?.previewUrl && imageState.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageState.previewUrl);
      }
    };
  }, [imageState?.previewUrl]);

  // Demo: set cookie when email is provided so API can track
  const setDemoCookie = () => {
    if (typeof document === "undefined") return
    const existing = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
    if (existing) return
    const id = crypto.randomUUID()
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=2592000`
  }

  // Early return during SSR
  if (!mounted) {
    return (
      <StudioLayout
        formContent={<FormPanel><div className="h-[800px]" /></FormPanel>}
        previewContent={<div className="h-[600px]" />}
        requestContent={<div className="h-[100px]" />}
        demoMode={demoMode}
      />
    )
  }

  const exteriorConfig = exterior

  if (!exteriorConfig) {
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

  const handleImageUpload = async (file: File, previewUrl: string) => {
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        setError("Please upload JPG, PNG, or WEBP images.")
        return
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("Image must be under 10MB.")
        return
      }

      if (imageState?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageState.previewUrl)
      }

      setError(null)
      setIsUploading(true)

      const fileExt = file.name.split(".").pop() || "jpg"
      const fileName = `${Date.now()}.${fileExt}`
      const supabase = createClient()

      const { error: uploadError } = await supabase.storage
        .from("reference-images")
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false
        })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from("reference-images")
        .getPublicUrl(fileName)

      const imageUrl = publicUrlData.publicUrl
      if (!imageUrl?.startsWith("http")) throw new Error("Invalid upload URL")

      setImageState({ file, previewUrl, uploadedUrl: imageUrl })
      handleConfigChange("image")(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setImageState({ file: null, previewUrl: null, uploadedUrl: null })
      handleConfigChange("image")(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleRender = async () => {
    if (demoMode) {
      if (!demoEmail) {
        setShowEmailGate(true)
        return
      }
      if (rendersRemaining <= 0) {
        setShowLimitModal(true)
        return
      }
    } else {
      if (authStatus === "initializing") return
      if (authStatus === "unauthenticated") {
        openLoginModal(pathname ?? "/studio/exterior")
        return
      }
    }

    console.log('[GENERATOR] Using OpenRouter Nano Banana for exterior')
    setError(null)
    setIsRendering(true)
    try {
      const renderId = crypto.randomUUID()
      const renderConfig: Record<string, any> = {
        ...exteriorConfig,
        renderType: "exterior"
      }
      const finalPrompt = buildGeminiPrompt(renderConfig)
      const referenceImageUrl =
        imageState.uploadedUrl ??
        (isString(exteriorConfig.image) && exteriorConfig.image.startsWith("http") ? exteriorConfig.image : null)

      const body: Record<string, unknown> = {
        prompt: finalPrompt,
        image: referenceImageUrl ?? null,
        renderType: "exterior",
        renderId,
      }
      if (demoMode && demoEmail) {
        body.demo = true
        body.demoEmail = demoEmail
      }

      const response = await fetch('/api/generate-openrouter', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error:', errorData)
        if (response.status === 429 && demoMode) {
          setShowLimitModal(true)
          setRendersRemaining(0)
          return
        }
        if (response.status === 401) {
          openLoginModal(pathname ?? '/studio/exterior')
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

      if (demoMode && data.rendersRemaining !== undefined) {
        setRendersRemaining(data.rendersRemaining)
      }
      if (!demoMode && data.usage?.creditsRemaining !== undefined) {
        setCreditsRemaining(data.usage.creditsRemaining)
      }

      if (imageUrl) {
        setCurrentRender(imageUrl)
        setLatestRenders(prev => [imageUrl, ...prev].slice(0, 4))
      } else {
        console.error('Failed to generate image: No URL returned from API')
      }
    } catch (err) {
      console.error('Error rendering design:', err)
      setError(err instanceof Error ? err.message : 'Failed to render design')
    } finally {
      setIsRendering(false)
    }
  }

  const handleThumbnailClick = (renderUrl: string) => {
    setCurrentRender(renderUrl)
  }

  const handleRemoveTag = (key: string) => {
    if (key in exteriorDefaults) {
      const typedKey = key as keyof typeof exteriorDefaults
      updateConfig({
        [typedKey]: exteriorDefaults[typedKey]
      })
    }
  }

  const formContent = (
    <FormPanel>
      <div className="space-y-10">
        <FormSection title="Building Settings" icon={Building2}>
          <div className="space-y-6">
            <div>
              <ImageOptionGrid
                label="Exterior Type"
                value={exteriorConfig.exteriorType ?? "house"}
                options={[
                  { value: "house", label: "House", icon: Building2 },
                  { value: "apartment", label: "Apartment", icon: Building2 },
                  { value: "commercial", label: "Commercial", icon: Building2 },
                  { value: "industrial", label: "Industrial", icon: Building2 },
                  { value: "institutional", label: "Institutional", icon: Building2 },
                ]}
                placeholder="Select exterior type"
                onChange={(value) => handleConfigChange("exteriorType")(value)}
              />
            </div>

            <div>
              <ImageOptionGrid
                label="Architectural Style"
                value={exteriorConfig.architecturalStyle ?? exteriorDefaults.architecturalStyle}
                options={architecturalStyleOptions.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                  icon: opt.icon
                }))}
                placeholder="Select architectural style"
                onChange={(value) => handleConfigChange("architecturalStyle")(value)}
              />
            </div>

            <div>
              <ImageOptionGrid
                label="Surrounding Environment"
                value={exteriorConfig.surroundingEnvironment ?? exteriorDefaults.surroundingEnvironment}
                options={surroundingEnvironmentOptions.map(opt => ({
                  value: opt.value,
                  label: opt.label,
                  icon: opt.icon
                }))}
                placeholder="Select environment"
                onChange={(value) => handleConfigChange("surroundingEnvironment")(value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Visual Design" icon={Palette}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Color Palette"
                value={exteriorConfig.colorPalette ?? exteriorDefaults.colorPalette}
                options={["neutral", "warm", "cool", "earthy", "bold"]}
                placeholder="Select or type color palette"
                onChange={(value) => handleConfigChange("colorPalette")(value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Lighting & Time" icon={Sun}>
          <div className="space-y-6">
            <div>
              <VariableSelect
                label="Lighting"
                value={exteriorConfig.lighting ?? exteriorDefaults.lighting}
                options={["natural", "warm", "cool", "dramatic"]}
                placeholder="Select or type lighting"
                onChange={(value) => handleConfigChange("lighting")(value)}
              />
            </div>
            <div>
              <SegmentedToggle
                label="Time of Day"
                value={exteriorConfig.timeOfDay ?? exteriorDefaults.timeOfDay}
                options={[
                  { value: "day", label: "Day", icon: Sun },
                  { value: "night", label: "Night", icon: Moon },
                ]}
                onChange={(value) => handleConfigChange("timeOfDay")(value)}
              />
            </div>
          </div>
        </FormSection>

        {/* Advanced Controls - Collapsible */}
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setAdvancedControlsOpen(!advancedControlsOpen)}
            className="w-full flex items-center justify-between text-left mb-2"
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-muted-foreground">Advanced (Optional)</h3>
              {(() => {
                const advanced = exteriorConfig.advanced || {}
                const hasNonDefault = 
                  (advanced.architectInfluence && advanced.architectInfluence !== "none") ||
                  (advanced.lens && advanced.lens !== "standard") ||
                  (advanced.geometry && advanced.geometry !== "balanced") ||
                  (advanced.symmetry && advanced.symmetry !== "subtle") ||
                  (advanced.mood && advanced.mood !== "neutral")
                return hasNonDefault ? (
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                ) : null
              })()}
            </div>
            {advancedControlsOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-150" />
            )}
          </button>
          <p className="text-xs text-muted-foreground/70 mb-4">Subtle refinements — defaults work well</p>
          
          {advancedControlsOpen && (
            <div className="space-y-10 mt-4 opacity-90 animate-in fade-in-0 duration-150">
              <FormSection title="Materials & Details">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Exterior Materials"
                      value={exteriorConfig.exteriorMaterials ?? ""}
                      options={["brick", "concrete", "wood", "stone", "metal", "glass", "stucco"]}
                      placeholder="Select or type exterior materials"
                      onChange={(value) => handleConfigChange("exteriorMaterials")(value)}
                    />
                  </div>
                  <div>
                    <VariableSelect
                      label="Roof Style"
                      value={exteriorConfig.roofStyle ?? ""}
                      options={["gable", "hip", "flat", "shed", "mansard", "gambrel"]}
                      placeholder="Select or type roof style"
                      onChange={(value) => handleConfigChange("roofStyle")(value)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Furnishings & Details">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Outdoor Furnishings"
                      value={exteriorConfig.outdoorFurnishings ?? ""}
                      options={["patio set", "outdoor sofa", "dining set", "none"]}
                      placeholder="Select or type outdoor furnishings"
                      onChange={(value) => handleConfigChange("outdoorFurnishings")(value)}
                    />
                  </div>
                  <div>
                    <VariableSelect
                      label="Exterior Accents"
                      value={exteriorConfig.exteriorAccents ?? ""}
                      options={["wood", "metal", "stone", "none"]}
                      placeholder="Select or type exterior accents"
                      onChange={(value) => handleConfigChange("exteriorAccents")(value)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Views & Context">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Exterior Views"
                      value={exteriorConfig.exteriorViews ?? ""}
                      options={["front", "side", "back", "corner", "aerial"]}
                      placeholder="Select or type exterior views"
                      onChange={(value) => handleConfigChange("exteriorViews")(value)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Focal Design">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Focal Point"
                      value={exteriorConfig.focalPoint ?? ""}
                      options={["entrance", "windows", "roof", "balcony", "architectural detail", "landscaping", "none"]}
                      placeholder="Select or type focal point"
                      onChange={(value) => handleConfigChange("focalPoint")(value)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Symmetry">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Symmetry Type"
                      value={exteriorConfig.symmetryType ?? ""}
                      options={["symmetrical", "asymmetrical", "radial"]}
                      placeholder="Select or type symmetry type"
                      onChange={(value) => handleConfigChange("symmetryType")(value)}
                    />
                  </div>
                  <div>
                    <VariableSelect
                      label="Symmetry Level"
                      value={exteriorConfig.symmetryLevel?.toString() ?? ""}
                      options={["0", "25", "50", "75", "100"]}
                      placeholder="Select symmetry level"
                      allowCustom={false}
                      onChange={(value) => handleConfigChange("symmetryLevel")(value ? parseInt(value, 10) : null)}
                    />
                  </div>
                </div>
              </FormSection>

              <FormSection title="Landscape Integration">
                <div className="space-y-6">
                  <div>
                    <VariableSelect
                      label="Landscaping Elements"
                      value={exteriorConfig.landscapingElements ?? ""}
                      options={["trees", "shrubs", "lawn", "garden beds", "pathways", "none"]}
                      placeholder="Select or type landscaping elements"
                      onChange={(value) => handleConfigChange("landscapingElements")(value)}
                    />
                  </div>
                </div>
              </FormSection>

              {/* Advanced Controls - Architect, Lens, etc. */}
              <div className="border-t border-border pt-6">
                <div className="space-y-4">
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
                  value={exteriorConfig.advanced?.architectInfluence ?? "none"}
                  options={["none", "foster", "gehry", "calatrava", "hadid", "koolhaas"]}
                  placeholder="Select architect influence"
                  allowCustom={false}
                  onChange={(value) => updateConfig({ 
                    advanced: { 
                      ...(exteriorConfig.advanced || {}), 
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
                  value={exteriorConfig.advanced?.lens ?? "standard"}
                  options={["standard", "wide", "telephoto", "fisheye", "ultra-wide"]}
                  placeholder="Select lens"
                  allowCustom={false}
                  onChange={(value) => updateConfig({ 
                    advanced: { 
                      ...(exteriorConfig.advanced || {}), 
                      lens: value 
                    } 
                  })}
                />
                {(exteriorConfig.advanced?.lens === "fisheye" || exteriorConfig.advanced?.lens === "ultra-wide") && (
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
                  value={exteriorConfig.advanced?.geometry ?? "balanced"}
                  options={["balanced", "rectangular", "curved", "angular", "organic"]}
                  placeholder="Select geometry"
                  allowCustom={false}
                  onChange={(value) => updateConfig({ 
                    advanced: { 
                      ...(exteriorConfig.advanced || {}), 
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
                  value={exteriorConfig.advanced?.symmetry ?? "subtle"}
                  options={["subtle", "balanced", "asymmetrical", "symmetrical"]}
                  placeholder="Select symmetry"
                  allowCustom={false}
                  onChange={(value) => updateConfig({ 
                    advanced: { 
                      ...(exteriorConfig.advanced || {}), 
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
                  value={exteriorConfig.advanced?.mood ?? "neutral"}
                  options={["neutral", "calm", "dramatic", "serene", "energetic"]}
                  placeholder="Select mood"
                  allowCustom={false}
                  onChange={(value) => updateConfig({ 
                    advanced: { 
                      ...(exteriorConfig.advanced || {}), 
                      mood: value 
                    } 
                  })}
                />
                {exteriorConfig.advanced?.mood === "dramatic" && (
                  <p className="mt-1 text-xs text-muted-foreground/70">Intense moods work best with simple materials.</p>
                )}
                  </div>
                </div>
              </div>
            </div>
            )}
        </div>

        <FormSection title="Reference Image (Optional)" icon={ImageIcon}>
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
              value={exteriorConfig.realism ?? exteriorDefaults.realism}
              onChange={(value) => handleConfigChange("realism")(value)}
            />
          </div>
          
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-2 rounded-md text-sm">
              {error}
            </div>
          )}

          {demoMode ? (
            <div className="pt-4 text-sm text-muted-foreground">
              You have <span className="font-medium text-foreground">{rendersRemaining}</span> demo render{rendersRemaining !== 1 ? "s" : ""} remaining.
            </div>
          ) : (
            <>
              <div className="pt-4 space-y-2">
                {creditsRemaining !== null && (
                  <div className="text-sm text-muted-foreground">
                    Credits remaining: <span className="font-medium text-foreground">{creditsRemaining}</span>
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  This render uses {imageState.uploadedUrl || (isString(exteriorConfig.image) && exteriorConfig.image.startsWith("http")) ? "1.5" : "1.0"} credits
                </div>
                <div className="text-xs text-muted-foreground italic">
                  Credits are only deducted after a successful render appears.
                </div>
              </div>
              <FirstPaidSessionHint className="mt-4" />
            </>
          )}
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
              disabled={
                (demoMode ? rendersRemaining <= 0 : authStatus === "initializing") || isRendering
              }
            >
              {authStatus === "initializing" && !demoMode
                ? "Checking..."
                : isRendering
                  ? "Rendering..."
                  : demoMode && rendersRemaining <= 0
                    ? "Demo limit reached"
                    : "Render Design"}
            </Button>
          </div>
        </div>
      </div>
    </FormPanel>
  )

  const previewContent = (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4">
      <StudioPreview
        currentRender={currentRender}
        latestRenders={latestRenders}
        isRendering={isRendering}
        onThumbnailClick={handleThumbnailClick}
        demoMode={demoMode}
      />
      {!demoMode && (
        <RenderActionsBar
          currentRenderUrl={currentRender}
          projectType="exterior"
          hasSavedProject={!!lastSavedProject}
          onDownload={() => {
            if (currentRender) downloadImage(currentRender, "exterior-render.png")
          }}
          onSaveToProject={() => setSaveDialogOpen(true)}
          onShareProject={() => lastSavedProject && setShareProject(lastSavedProject)}
          onCreateMockup={() => setMockupDialogOpen(true)}
        />
      )}
    </div>
  )

  const requestContent = (
    <RequestSummary
      config={exteriorConfig}
      onRemove={handleRemoveTag}
      onClearAll={() => {
        updateConfig(exteriorDefaults)
        setCurrentRender(null)
        setLatestRenders([])
      }}
    />
  )

  return (
    <>
      <StudioLayout
        formContent={formContent}
        previewContent={previewContent}
        requestContent={requestContent}
        demoMode={demoMode}
      />
      {!demoMode && (
        <>
          <SaveToProjectDialog
            open={saveDialogOpen}
            onOpenChange={setSaveDialogOpen}
            projectType="exterior"
            imageUrl={currentRender ?? ""}
            sourceImageUrl={imageState.uploadedUrl ?? (isString(exteriorConfig?.image) && exteriorConfig.image ? String(exteriorConfig.image) : null)}
            onSuccess={(projectId, renderId, projectName) => {
              const now = new Date().toISOString()
              setLastSavedProject({
                id: projectId,
                userId: "",
                name: projectName,
                projectType: "exterior",
                coverImageUrl: currentRender,
                renderCount: 1,
                updatedAt: now,
                createdAt: now,
                shareSlug: null,
                isShared: false,
              })
              setLastSavedRenderId(renderId)
            }}
          />
          <ShareProjectDialog
            project={shareProject}
            open={!!shareProject}
            onOpenChange={(open) => !open && setShareProject(null)}
            onEnableShare={async (projectId) => {
              const result = await enableProjectShare(projectId)
              if ("error" in result) return result
              if (lastSavedProject && lastSavedProject.id === projectId) {
                setLastSavedProject((p) => (p ? { ...p, shareSlug: result.slug, isShared: true } : p))
              }
              setShareProject((p) => (p && p.id === projectId ? { ...p, shareSlug: result.slug, isShared: true } : p))
              return { slug: result.slug }
            }}
            onDisableShare={async (projectId) => {
              const result = await disableProjectShare(projectId)
              if ("error" in result) return result
              if (lastSavedProject && lastSavedProject.id === projectId) {
                setLastSavedProject((p) => (p ? { ...p, isShared: false } : p))
              }
              setShareProject((p) => (p && p.id === projectId ? { ...p, isShared: false } : p))
              return {}
            }}
          />
          <CreateMockupDialog
            open={mockupDialogOpen}
            onOpenChange={setMockupDialogOpen}
            renderId={lastSavedRenderId}
          />
        </>
      )}
      {demoMode && (
        <>
          <DemoEmailGate
            open={showEmailGate}
            onContinue={(email) => {
              setDemoEmail(email)
              setShowEmailGate(false)
              setDemoCookie()
              fetch(`/api/demo-render?email=${encodeURIComponent(email)}`, { credentials: "include" })
                .then((r) => r.json())
                .then((d) => {
                  if (typeof d.rendersRemaining === "number") setRendersRemaining(d.rendersRemaining)
                })
                .catch(() => {})
            }}
          />
          <DemoLimitModal open={showLimitModal} onClose={() => setShowLimitModal(false)} />
        </>
      )}
    </>
  )
}
