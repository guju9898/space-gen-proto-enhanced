"use client"

import { useState } from "react"
import { useDesignConfig } from './useDesignConfig'
import { ExteriorConfig, InteriorConfig, LandscapeConfig, RenderRequest, RenderResponse } from "@/types/studio"

interface RenderResult {
  imageUrl: string | null
  error: string | null
}

interface RenderConfig {
  renderType: 'interior' | 'exterior' | 'landscape'
  sourceImage: string | null
  config: InteriorConfig | ExteriorConfig | LandscapeConfig
}

// Simulated API call - replace with actual API integration later
const mockGenerateImage = async (config: RenderConfig): Promise<RenderResult> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  // For demo purposes, return the source image
  // In production, this would call the actual AI service
  if (!config.sourceImage) {
    return {
      imageUrl: null,
      error: 'No source image provided'
    }
  }

  // Simulate 10% chance of error
  if (Math.random() < 0.1) {
    throw new Error('Simulated API error')
  }

  return {
    imageUrl: config.sourceImage,
    error: null
  }
}

export function useRenderEngine() {
  const { config: designConfig } = useDesignConfig()
  const [isRendering, setIsRendering] = useState(false)
  const [lastResult, setLastResult] = useState<RenderResult>({ imageUrl: null, error: null })

  const render = async (config: RenderConfig) => {
    setIsRendering(true)
    setLastResult({ imageUrl: null, error: null })

    try {
      // In production, replace mockGenerateImage with actual API call
      const result = await mockGenerateImage(config)
      setLastResult(result)
      return result
    } catch (error) {
      const errorResult = {
        imageUrl: null,
        error: error instanceof Error ? error.message : 'An unknown error occurred'
      }
      setLastResult(errorResult)
      return errorResult
    } finally {
      setIsRendering(false)
    }
  }

  return {
    render,
    isRendering,
    lastResult
  }
}
