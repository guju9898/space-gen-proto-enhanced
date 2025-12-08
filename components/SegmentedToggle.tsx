"use client";

import { cn } from "@/lib/utils";

interface SegmentedToggleProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedToggle({ options, value, onChange, className }: SegmentedToggleProps) {
  return (
    <div className={cn("inline-flex bg-gray-800 p-1 rounded-full", className)}>
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-4 py-1.5 rounded-full font-semibold transition-all",
              isActive
                ? "bg-white text-black"
                : "text-gray-400 hover:text-white"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}


