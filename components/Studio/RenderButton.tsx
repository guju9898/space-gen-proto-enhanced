"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RenderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function RenderButton({ loading, className, children, animated, ...props }: RenderButtonProps & { animated?: boolean }) {
  return (
    <button
      className={cn(
        "w-full h-14 text-base font-semibold text-white rounded-lg shadow-lg",
        "bg-gradient-to-r from-[#FF6A00] to-[#7F00FF]",
        "hover:shadow-xl hover:shadow-purple-500/50 transition-all",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        animated && "animate-pulse",
        "md:w-auto",
        className
      )}
      style={{
        background: "linear-gradient(45deg, #FF6A00, #7F00FF)",
      }}
      disabled={loading}
      {...props}
    >
      {loading && <Loader2 className="w-5 h-5 animate-spin" />}
      {children}
    </button>
  );
}
