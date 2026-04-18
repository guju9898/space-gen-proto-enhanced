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

interface ImageState {
  file: File | null;
  previewUrl: string | null;
  uploadedUrl: string | null; // Supabase Storage public URL
}

export default function InteriorStudioPage() {
  const searchParams = useSearchParams()
  const demoMode = searchParams?.get("demo") === "true"
  const { config, updateConfig } = useInteriorConfig()
  const { status: authStatus, openLoginModal } = useAuth()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [currentRender, setCurrentRender] = useState<string | null>(null)
  const [latestRenders, setLatestRenders] = useState<string[]>([])
  const [isRendering, setIsRendering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imageState, setImageState] = useState<ImageState | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
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

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024

  // Handle client-side initialization
  useEffect(() => {
    setMounted(true)
    updateConfig(interiorDefaults)
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
        URL.revokeObjectURL(imageState.previewUrl)
      }
    }
  }, [imageState?.previewUrl])

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
  if (!config) return null;

  const handleConfigChange = (key: keyof InteriorConfig, value: string | number | File | null) => {
    setError(null) // Clear any previous errors
    updateConfig({ [key]: value })
  }

  const handleImageUpload = async (file: File, previewUrl: string) => {
    try {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
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

      const { data, error: uploadError } = await supabase.storage
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
      handleConfigChange("image", imageUrl)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.")
      setImageState(null)
      handleConfigChange("image", null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async (config: Record<string, any>) => {
    const imageUrl = imageState?.uploadedUrl || (isString(config.image) && config.image.startsWith("http") ? config.image : null)
    if (!imageUrl || !imageUrl.startsWith("http")) {
      setError("Upload a room photo to generate.")
      return
    }

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
        openLoginModal(pathname ?? "/studio/interior")
        return
      }
    }

    setError(null)
    setIsRendering(true)

    try {
      const renderId = crypto.randomUUID()
      const finalPrompt = buildPrompt(config)

      const body: Record<string, unknown> = {
        prompt: finalPrompt,
        imageUrl,
        realism: config.realism ?? 50,
        renderId,
      }
      if (demoMode && demoEmail) {
        body.demo = true
        body.demoEmail = demoEmail
      }

      const response = await fetch("/api/generate-replicate", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        if (response.status === 429 && demoMode) {
          setShowLimitModal(true)
          setRendersRemaining(0)
          return
        }
        if (response.status === 401) {
          openLoginModal(pathname ?? "/studio/interior")
          throw new Error("Please log in to generate images.")
        }
        const errorMessage = response.status === 402
          ? getCreditErrorMessage(err.error)
          : (err.error || "Interior generation failed")
        throw new Error(errorMessage)
      }

      const data = await response.json()
      const generatedImageUrl = data.imageUrl

      if (demoMode && data.rendersRemaining !== undefined) {
        setRendersRemaining(data.rendersRemaining)
      }
      if (!demoMode && data.usage?.creditsRemaining !== undefined) {
        setCreditsRemaining(data.usage.creditsRemaining)
      }

      if (generatedImageUrl) {
        setCurrentRender(generatedImageUrl)
        setLatestRenders(prev => [generatedImageUrl, ...prev].slice(0, 4))
      } else {
        console.error("Failed to generate image: No URL returned from API")
      }
    } catch (error) {
      console.error("❌ Generation error:", error)
      setError(error instanceof Error ? error.message : "Interior generation failed")
    }

    setIsRendering(false)
  }

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
        
        <FormSection
          title="Room Settings"
          icon={Layout}
          tips="Core space and style choices. These define the type of room and overall design language the AI will follow."
        >
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

        <FormSection
          title="Visual Composition"
          icon={Camera}
          tips="How the camera frames the space. Adjust these to control perspective and how the room is visually organized."
        >
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

        <FormSection
          title="Materials & Textures"
          icon={Star}
          tips="Surface feel of the space. Use this to guide flooring, finishes, and texture emphasis without changing the layout."
        >
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

        <FormSection
          title="Lighting & Atmosphere"
          icon={Lightbulb}
          tips="Overall mood and light quality. Use this to control how bright, soft, or dramatic the interior feels."
        >
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

        <FormSection
          title="Architectural Details"
          icon={Building}
          tips="Refinements to the bones of the space—geometry, architect influence, and key structural touches."
        >
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
                placeholder="Select or type geometry"
                onChange={(value) => handleConfigChange("geometry", value)}
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Reference Image" icon={ImageIcon}>
          <p className="text-xs text-muted-foreground mb-2">
            Upload JPG, PNG, or WEBP images under 10MB. Higher resolution images produce better results.
          </p>
          <ImageUpload
            onUpload={handleImageUpload}
            currentPreview={imageState?.previewUrl}
            accept="image/jpeg,image/png,image/webp"
            maxSize={MAX_IMAGE_SIZE}
            isLoading={isUploading}
          />
          <div className="mt-3 text-xs text-muted-foreground space-y-1">
            <p>Supported formats: JPG, PNG, WEBP</p>
            <p>Max size: 10MB</p>
            <p>Higher resolution images produce better results.</p>
            <p>Avoid blurry, dark, or heavily compressed images.</p>
          </div>
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
          
          {demoMode ? (
            <div className="pt-4 text-sm text-muted-foreground">
              You have <span className="font-medium text-foreground">{rendersRemaining}</span> demo render{rendersRemaining !== 1 ? "s" : ""} remaining.
            </div>
          ) : (
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
          )}

          {!demoMode && <FirstPaidSessionHint className="mt-4" />}
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
              disabled={
                (demoMode ? rendersRemaining <= 0 : authStatus === "initializing") ||
                isRendering ||
                !(imageState?.uploadedUrl || (isString(config.image) && config.image.startsWith("http")))
              }
            >
              {authStatus === "initializing" && !demoMode
                ? "Checking..."
                : isRendering
                  ? "Generating..."
                  : demoMode && rendersRemaining <= 0
                    ? "Demo limit reached"
                    : "Generate"}
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
          projectType="interior"
          hasSavedProject={!!lastSavedProject}
          onDownload={() => {
            if (currentRender) downloadImage(currentRender, "interior-render.png")
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
      config={config ?? undefined}
      onRemove={handleRemoveTag}
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
            projectType="interior"
            imageUrl={currentRender ?? ""}
            sourceImageUrl={imageState?.uploadedUrl ?? (config && isString(config.image) && config.image ? String(config.image) : null)}
            onSuccess={(projectId, renderId, projectName) => {
              const now = new Date().toISOString()
              setLastSavedProject({
                id: projectId,
                userId: "",
                name: projectName,
                projectType: "interior",
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
