"use client"

import { Slider } from "@/components/ui/slider"

interface RealisticSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function RealisticSlider({ value, onChange }: RealisticSliderProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>Stylized</span>
        <span>Photorealistic</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([newValue]) => onChange(newValue)}
        min={0}
        max={100}
        step={1}
        className="w-full"
      />
      <div className="text-center text-sm text-muted-foreground">
        {value}% Realism
      </div>
    </div>
  )
} 