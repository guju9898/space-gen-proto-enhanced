"use client"

import { ReactNode, ElementType } from "react"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface FormSectionProps {
  title: string;
  children: ReactNode;
  rightElement?: ReactNode;
  tips?: string;
  icon?: ElementType;
}

export function FormSection({ 
  title, 
  children, 
  rightElement, 
  tips = "Get rendering tips",
  icon: Icon
}: FormSectionProps) {
  return (
    <div className="pb-4 border-b border-gray-700 last:border-0 last:pb-0 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-400" />}
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {rightElement}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-gray-400 hover:text-white cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tips}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 