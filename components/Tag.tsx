"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  className?: string;
  icon?: React.ReactNode;
}

export function Tag({ children, onRemove, className, icon }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-700 text-white",
        onRemove && "cursor-pointer hover:bg-gray-600",
        className
      )}
      onClick={onRemove}
    >
      {icon && <span className="mr-1.5">{icon}</span>}
      {children}
      {onRemove && (
        <X className="ml-1.5 w-3 h-3 opacity-70 hover:opacity-100" />
      )}
    </span>
  );
}


