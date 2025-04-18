"use client"

import { useDesignConfig } from "@/hooks/useDesignConfig"
import { Building2, Home, Trees } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const studios = [
  {
    name: "Interior",
    path: "/studio/interior",
    icon: Home,
  },
  {
    name: "Exterior",
    path: "/studio/exterior",
    icon: Building2,
  },
  {
    name: "Landscape",
    path: "/studio/landscape",
    icon: Trees,
  },
]

export default function StudioModeToggle() {
  const pathname = usePathname()
  const { setActiveStudio } = useDesignConfig()

  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-900 rounded-lg">
      {studios.map((studio) => {
        const isActive = pathname === studio.path
        const Icon = studio.icon
        return (
          <Link
            key={studio.path}
            href={studio.path}
            onClick={() => setActiveStudio(studio.name.toLowerCase() as 'interior' | 'exterior' | 'landscape')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isActive
                ? "bg-gradient-to-r from-[#FF6B00] to-[#9747ff] text-white"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{studio.name}</span>
          </Link>
        )
      })}
    </div>
  )
} 