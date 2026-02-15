"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"

interface SliderControlProps {
  min: number
  max: number
  step?: number
  value: number
  onChange: (value: number) => void
  labels?: [string, string] // Optional start and end labels
  disabled?: boolean
}

export default function SliderControl({
  min,
  max,
  step = 1,
  value,
  onChange,
  labels,
  disabled = false,
}: SliderControlProps) {
  const [isDragging, setIsDragging] = useState(false)
  const sliderRef = useRef<HTMLDivElement>(null)

  const percentage = ((value - min) / (max - min)) * 100

  const handleSliderClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return

    const slider = sliderRef.current
    if (!slider) return

    const rect = slider.getBoundingClientRect()
    const x = e.clientX - rect.left
    const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const newValue = Math.round((newPercentage / 100) * (max - min) + min)

    // Round to nearest step
    const steppedValue = Math.round(newValue / step) * step
    onChange(steppedValue)
  }

  const handleMouseDown = () => {
    if (disabled) return
    setIsDragging(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return

      const rect = sliderRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const newPercentage = Math.max(0, Math.min(100, (x / rect.width) * 100))
      const newValue = Math.round((newPercentage / 100) * (max - min) + min)

      // Round to nearest step
      const steppedValue = Math.round(newValue / step) * step
      onChange(steppedValue)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, min, max, step, onChange])

  return (
    <div className={`w-full ${disabled ? "opacity-50" : ""}`}>
      <div ref={sliderRef} className="relative h-2 bg-zinc-700 rounded-full cursor-pointer" onClick={(e) => handleSliderClick(e)}>
        <div
          className="absolute h-full bg-gradient-to-r from-[#F97066] to-[#AD74FF] rounded-full"
          style={{ width: `${percentage}%` }}
        ></div>
        <div
          className="absolute w-4 h-4 bg-white rounded-full -mt-1 transform -translate-x-1/2"
          style={{ left: `${percentage}%` }}
          onMouseDown={handleMouseDown}
        ></div>
      </div>

      {labels && (
        <div className="flex justify-between mt-2 text-xs text-zinc-400">
          <span>{labels[0]}</span>
          <span>{labels[1]}</span>
        </div>
      )}

      <div className="text-center mt-2 text-sm text-white">{value}</div>
    </div>
  )
}
