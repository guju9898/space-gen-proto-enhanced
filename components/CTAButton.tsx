"use client";

import { cn } from "@/lib/utils";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "outline";
  animated?: boolean;
}

export function CTAButton({ 
  variant = "default", 
  animated = false,
  className, 
  children, 
  ...props 
}: CTAButtonProps) {
  if (variant === "ghost") {
    return (
      <button
        className={cn(
          "h-14 w-full rounded-lg text-white font-semibold text-base",
          "hover:bg-gray-800 transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        className={cn(
          "h-14 w-full rounded-lg text-white font-semibold text-base",
          "border border-gray-600 hover:bg-gray-800 transition-colors",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      className={cn(
        "h-14 w-full rounded-lg text-white font-semibold text-base",
        "bg-gradient-cta hover:brightness-110 transition-all",
        "shadow-lg hover:shadow-xl hover:shadow-purple-500/50",
        animated && "animate-pulse",
        className
      )}
      style={{
        background: "linear-gradient(45deg, #FF6A00, #7F00FF)",
      }}
      {...props}
    >
      {children}
    </button>
  );
}


