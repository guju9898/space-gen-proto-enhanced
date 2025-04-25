"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RenderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function RenderButton({ loading, className, children, ...props }: RenderButtonProps) {
  return (
    <button
      className={cn(
        "w-full px-6 py-3 text-lg font-medium text-white rounded-md shadow-md",
        "bg-gradient-to-r from-primary via-purple-600 to-indigo-600",
        "hover:opacity-90 transition-opacity",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
