"use client"

import type { ReactNode } from "react"
import { useDesignConfig } from "@/hooks/useDesignConfig"
import RenderButton from "./RenderButton"
import { ExteriorConfig, InteriorConfig, LandscapeConfig } from "@/types/studio"

interface FormPanelProps {
  children: ReactNode
  title?: string
  onRender?: () => void
  disableRender?: boolean
  renderType?: "interior" | "exterior" | "landscape"
}

export default function FormPanel({
  children,
  title,
  onRender,
  disableRender = false,
  renderType = "interior",
}: FormPanelProps) {
  const { config } = useDesignConfig()

  // Determine if render button should be disabled based on config
  const isRenderDisabled = () => {
    if (disableRender) return true

    if (renderType === "interior") {
      const interiorConfig = config.interior as InteriorConfig
      return !interiorConfig.roomType || !interiorConfig.style
    } else if (renderType === "exterior") {
      const exteriorConfig = config.exterior as ExteriorConfig
      return !exteriorConfig.buildingType || !exteriorConfig.architecturalStyle || !exteriorConfig.style
    } else if (renderType === "landscape") {
      const landscapeConfig = config.landscape as LandscapeConfig
      return !landscapeConfig.terrainType || !landscapeConfig.vegetation
    }

    return false
  }

  return (
    <div className="space-y-6">
      {title && (
        <h3 className="text-lg font-medium text-white mb-4">{title}</h3>
      )}
      <div className="space-y-4">
        {children}
      </div>

      <div className="pt-4 border-t border-border">
        <RenderButton disabled={isRenderDisabled()} onRenderComplete={onRender ? () => onRender() : undefined} />
      </div>
    </div>
  )
}
