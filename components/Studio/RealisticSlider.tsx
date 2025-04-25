"use client"

import { Slider } from "@/components/ui/slider"

interface RealisticSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function RealisticSlider({ value, onChange }: RealisticSliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">
          Rendering Style
        </label>
        <span className="text-sm text-muted-foreground">
          {value}%
        </span>
      </div>
      <div className="relative pt-6">
        <Slider
          value={[value]}
          onValueChange={([newValue]) => onChange(newValue)}
          min={1}
          max={100}
          step={1}
          className="relative z-10"
        />
        <div className="absolute inset-x-0 top-0 flex justify-between text-xs text-muted-foreground">
          <span>Stylized</span>
          <span>Photorealistic</span>
        </div>
      </div>
    </div>
  );
} 