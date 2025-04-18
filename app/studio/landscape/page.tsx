"use client"

import { useState } from "react"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import StudioLayout from "@/components/Studio/StudioLayout"
import FormPanel from "@/components/Studio/FormPanel"
import ImageUploadPanel from "@/components/Studio/ImageUploadPanel"
import StudioPreview from "@/components/Studio/StudioPreview"
import RequestSummary from "@/components/Studio/RequestSummary"
import TipsModal from "@/components/Studio/TipsModal"
import RequestInfoModal from "@/components/Studio/RequestInfoModal"
import DesignControlsPanel from "@/components/Studio/Variables/DesignControlsPanel"

export default function LandscapeStudioPage() {
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [renderImage, setRenderImage] = useState<string | null>(null)
  const [isRendering, setIsRendering] = useState(false)
  const [renderError, setRenderError] = useState<string | null>(null)
  const [showRequestInfo, setShowRequestInfo] = useState(false)
  const [showTipsInfo, setShowTipsInfo] = useState(false)

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    setRenderImage(null)

    try {
      const imageUrl = URL.createObjectURL(file)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentImage(imageUrl)
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleImageRemove = () => {
    setCurrentImage(null)
    setRenderImage(null)
  }

  const handleRenderDesign = () => {
    setIsRendering(true)
    setRenderError(null)

    setTimeout(() => {
      setIsRendering(false)
      if (Math.random() > 0.1) {
        setRenderImage("/studio/generated-design.jpg")
      } else {
        setRenderError("Failed to generate design. Please try again.")
      }
    }, 3000)
  }

  return (
    <DesignConfigProvider>
      <StudioLayout
        formContent={
          <FormPanel onRender={handleRenderDesign} disableRender={!currentImage} renderType="landscape">
            <DesignControlsPanel designType="landscape" onGenerateDesign={handleRenderDesign} />
          </FormPanel>
        }
        previewContent={
          <StudioPreview
            currentImage={currentImage}
            renderImage={renderImage}
            isRendering={isRendering}
            onRender={handleRenderDesign}
            error={renderError}
          />
        }
        requestContent={<RequestSummary />}
      >
        <ImageUploadPanel
          currentImage={currentImage}
          onUpload={handleImageUpload}
          onRemove={handleImageRemove}
          isUploading={isUploading}
        />
        <RequestInfoModal isOpen={showRequestInfo} onClose={() => setShowRequestInfo(false)} />
        <TipsModal isOpen={showTipsInfo} onClose={() => setShowTipsInfo(false)} />
      </StudioLayout>
    </DesignConfigProvider>
  )
} 