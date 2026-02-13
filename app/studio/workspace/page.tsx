"use client"

import { useState, useEffect } from "react"
import { Info, LayoutGrid, Sun } from "lucide-react"
import { DesignConfigProvider, useDesignConfig } from "@/hooks/useDesignConfig"
import DesignStyleModal from "@/components/Studio/DesignStyleModal"
import TipsModal from "@/components/Studio/TipsModal"
import { RenderButton } from "@/components/Studio/RenderButton"
import ImageUploadPanel from "@/components/Studio/ImageUploadPanel"
import RenderPreview from "@/components/Studio/RenderPreview"
import { RequestSummary } from "@/components/Studio/RequestSummary"
import { DropdownSelector } from "@/components/Studio/Variables/DropdownSelector"
import ImageSelector from "@/components/Studio/Variables/ImageSelector"
import ColorPaletteSelector from "@/components/Studio/Variables/ColorPaletteSelector"
import TagSelector from "@/components/Studio/Variables/TagSelector"
import SliderControl from "@/components/Studio/Variables/SliderControl"

// Mock data for the selectors
const roomTypes = [
  { id: "bedroom", label: "Bedroom", imageUrl: "/studio/bedroom-thumbnail.jpg" },
  { id: "living-room", label: "Living Room", imageUrl: "/studio/living-room-thumbnail.jpg" },
  { id: "kitchen", label: "Kitchen", imageUrl: "/studio/kitchen-thumbnail.jpg" },
  { id: "bathroom", label: "Bathroom", imageUrl: "/studio/bathroom-thumbnail.jpg" },
]

const designStyles = [
  { id: "industrial", label: "Industrial", imageUrl: "/studio/industrial-thumbnail.jpg" },
  { id: "modern", label: "Modern", imageUrl: "/studio/modern-thumbnail.jpg" },
  { id: "scandinavian", label: "Scandinavian", imageUrl: "/studio/scandinavian-thumbnail.jpg" },
  { id: "minimalist", label: "Minimalist", imageUrl: "/studio/minimalist-thumbnail.jpg" },
]

const compositionOptions = [
  { value: "centered", label: "Centered" },
  { value: "rule-of-thirds", label: "Rule of Thirds" },
  { value: "diagonal", label: "Diagonal" },
  { value: "symmetrical", label: "Symmetrical" },
]

const moodOptions = [
  { value: "calm", label: "Calm" },
  { value: "energetic", label: "Energetic" },
  { value: "cozy", label: "Cozy" },
  { value: "luxurious", label: "Luxurious" },
]

const colorPalettes = [
  { id: "neutral", label: "Neutral", colors: ["#E8E4D9", "#D4C8BE", "#A69F98", "#474747"] },
  { id: "warm", label: "Warm", colors: ["#FCBA04", "#FF5C4D", "#D62839", "#7C3626"] },
  { id: "cool", label: "Cool", colors: ["#A0DDFF", "#758ECD", "#7D7ABC", "#C56183"] },
  { id: "earthy", label: "Earthy", colors: ["#5F7367", "#8BA888", "#BAA898", "#E5E0DC"] },
]

const lightingOptions = [
  { value: "natural", label: "Natural" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" },
  { value: "dramatic", label: "Dramatic" },
]

const materialOptions = [
  { value: "wood", label: "Wood" },
  { value: "metal", label: "Metal" },
  { value: "glass", label: "Glass" },
  { value: "concrete", label: "Concrete" },
  { value: "fabric", label: "Fabric" },
]

function StudioWorkspace() {
  if (typeof window === "undefined") return null;
  const { config, updateConfig, resetConfig, setActiveStudio } = useDesignConfig()
  const currentConfig = config.interior
  const [uploadedImage, setUploadedImage] = useState<string | null>("/studio/bedroom-preview.jpg")
  const [isUploading, setIsUploading] = useState(false)
  useEffect(() => { setActiveStudio("interior") }, [setActiveStudio])
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [showTipsModal, setShowTipsModal] = useState(false)
  const [renderImage, setRenderImage] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    setRenderImage(null) // Clear previous render when uploading new image

    try {
      // In a real app, you would upload the file to your server or cloud storage
      // For this example, we'll create a local URL
      const imageUrl = URL.createObjectURL(file)

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setUploadedImage(imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageRemove = () => {
    setUploadedImage(null)
    setRenderImage(null)
  }

  const handleSelectStyle = (styleId: string) => {
    updateConfig("designStyle", styleId)
  }

  const handleRenderComplete = (imageUrl: string) => {
    setRenderImage(imageUrl)
    setRenderError(null)
    setIsRendering(false)
  }

  const handleRenderError = (error: string) => {
    setRenderError(error)
    setIsRendering(false)
  }

  const handleRenderDesign = () => {
    setIsRendering(true)
    // This would be replaced with an actual API call in a real app
    setTimeout(() => {
      handleRenderComplete("/studio/generated-design.jpg")
    }, 3000)
  }

  // Get active selections for the request panel
  const activeSelections = Object.entries(config ?? {}).filter(
    ([key, value]) => value !== null && value !== undefined && !Array.isArray(value) && key !== "realism",
  )

  // Get display name for a config value
  const getDisplayName = (key: string, value: string): string => {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  return (
    <div className="flex h-full">
      {/* Left Column */}
      <div className="w-[360px] border-r border-zinc-800 flex flex-col">
        {/* Tabs */}
        <div className="p-4">
          <div className="flex space-x-2 mb-6">
            <button className="px-4 py-2 bg-zinc-800 rounded-md text-white">Interior</button>
            <button className="px-4 py-2 text-zinc-400 hover:text-white">Exterior</button>
            <button className="px-4 py-2 text-zinc-400 hover:text-white">Landscape</button>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h2 className="text-white font-medium">Your current interior</h2>
            <button onClick={() => setShowTipsModal(true)} className="flex items-center text-zinc-400 hover:text-white">
              <span className="mr-1 text-sm">Tips</span>
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Image */}
        <div className="px-4 mb-4">
          <ImageUploadPanel
            currentImage={uploadedImage}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            isUploading={isUploading}
          />
        </div>

        {/* Design Controls */}
        <div className="px-4 space-y-4 overflow-y-auto flex-1">
          {/* Room Type */}
          <div>
            <h3 className="text-white font-medium mb-2">Room type</h3>
            <ImageSelector
              options={roomTypes}
              value={currentConfig?.roomType ?? null}
              onChange={(value) => updateConfig("roomType", value)}
            />
          </div>

          {/* Design Style */}
          <div>
            <h3 className="text-white font-medium mb-2">Design style</h3>
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                {currentConfig?.designStyle
                  ? `Selected: ${currentConfig.designStyle.charAt(0).toUpperCase() + currentConfig.designStyle.slice(1)}`
                  : "No style selected"}
              </div>
              <button
                onClick={() => setShowStyleModal(true)}
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md text-sm transition-colors"
              >
                Choose style
              </button>
            </div>
          </div>

          {/* Composition */}
          <div>
            <h3 className="text-white font-medium mb-2">Composition</h3>
            <DropdownSelector
              options={compositionOptions}
              value={currentConfig?.compositionStyle ?? ""}
              onChange={(value) => updateConfig("compositionStyle", value)}
              placeholder="Select composition"
              icon={LayoutGrid}
            />
          </div>

          {/* Mood */}
          <div>
            <h3 className="text-white font-medium mb-2">Mood</h3>
            <DropdownSelector
              options={moodOptions}
              value={currentConfig?.mood ?? ""}
              onChange={(value) => updateConfig("mood", value)}
              placeholder="Select mood"
            />
          </div>

          {/* Color palette */}
          <div>
            <h3 className="text-white font-medium mb-2">Color palette</h3>
            <ColorPaletteSelector
              options={colorPalettes}
              value={currentConfig?.colorPalette ?? null}
              onChange={(value) => updateConfig("colorPalette", value)}
            />
          </div>

          {/* Lighting */}
          <div>
            <h3 className="text-white font-medium mb-2">Lighting</h3>
            <DropdownSelector
              options={lightingOptions}
              value={currentConfig?.lighting ?? ""}
              onChange={(value) => updateConfig("lighting", value)}
              placeholder="Select lighting"
              icon={Sun}
            />
          </div>

          {/* Materials */}
          <div>
            <h3 className="text-white font-medium mb-2">Materials</h3>
            <TagSelector
              options={materialOptions}
              selectedValues={((currentConfig as unknown as Record<string, unknown>)?.materials as string[] | undefined) || []}
              onChange={(values) => updateConfig("materials", values)}
              maxSelections={3}
            />
          </div>

          {/* Realism Slider */}
          <div>
            <h3 className="text-white font-medium mb-2">Realism</h3>
            <SliderControl
              min={0}
              max={100}
              step={10}
              value={currentConfig?.realism ?? 50}
              onChange={(value) => updateConfig("realism", value)}
              labels={["Stylized", "Photorealistic"]}
            />
          </div>
        </div>
      </div>

      {/* Middle Column - Render Preview */}
      <div className="flex-1 border-r border-zinc-800 p-6">
        <RenderPreview
          renderImage={renderImage && renderImage.trim() !== "" ? renderImage : null}
          isLoading={isRendering}
          error={renderError}
          emptyStateText="You don't have any generated image yet"
        />
      </div>

      {/* Right Column - Request Summary */}
      <div className="w-[320px] p-6">
        <RequestSummary />

        {/* Render Button */}
        <div className="absolute bottom-6 right-6 left-[calc(360px+800px+24px)]">
          <RenderButton
            disabled={!currentConfig?.roomType || !currentConfig?.designStyle || isRendering}
            onRenderComplete={handleRenderComplete}
            onRenderError={handleRenderError}
          />
        </div>
      </div>

      {/* Modals */}
      <DesignStyleModal
        isOpen={showStyleModal}
        onClose={() => setShowStyleModal(false)}
        onSelectStyle={handleSelectStyle}
        selectedStyle={currentConfig?.designStyle ?? null}
      />

      <TipsModal isOpen={showTipsModal} onClose={() => setShowTipsModal(false)} />
    </div>
  )
}

export default function StudioWorkspacePage() {
  if (typeof window === "undefined") return null;
  return (
    <DesignConfigProvider>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center">
            <div className="flex items-center mr-8">
              <div className="w-8 h-8 bg-gradient-to-r from-[#F97066] to-[#AD74FF] rounded mr-2"></div>
              <span className="font-bold text-lg">Space Gen</span>
            </div>
            <nav className="flex space-x-8">
              <a href="/studio" className="text-purple-400 font-medium">
                Studio
              </a>
              <a href="/projects" className="text-zinc-400 hover:text-white">
                My projects
              </a>
              <a href="/subscription" className="text-zinc-400 hover:text-white">
                Subscription
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-zinc-900 rounded-md px-2 py-1">
              <span className="text-sm mr-1">EN</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400 mr-1"
              >
                <path d="M12 2v1" />
                <path d="M12 21v1" />
                <path d="M4.93 4.93l.7.7" />
                <path d="M18.36 18.36l.7.7" />
                <path d="M2 12h1" />
                <path d="M21 12h1" />
                <path d="M4.93 19.07l.7-.7" />
                <path d="M18.36 5.64l.7-.7" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span className="text-sm">178</span>
            </div>
            <div className="flex items-center bg-zinc-900 rounded-full px-4 py-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400 mr-2"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-sm">Martin</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="h-[calc(100vh-64px)]">
          <StudioWorkspace />
        </div>
      </div>
    </DesignConfigProvider>
  )
}
