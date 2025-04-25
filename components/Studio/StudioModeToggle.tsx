"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Building2, Trees } from "lucide-react"
import { cn } from "@/lib/utils"

const studioTypes = [
  {
    name: "Interior",
    href: "/studio/interior",
    icon: Home
  },
  {
    name: "Exterior",
    href: "/studio/exterior",
    icon: Building2
  },
  {
    name: "Landscape",
    href: "/studio/landscape",
    icon: Trees
  }
]

export function StudioModeToggle() {
  const pathname = usePathname()

  return (
    <div className="flex items-center space-x-2">
      {studioTypes.map((type) => {
        const Icon = type.icon
        const isActive = pathname.startsWith(type.href)
        
        return (
          <Link
            key={type.name}
            href={type.href}
            className={cn(
              "flex items-center space-x-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground/60 hover:bg-muted"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{type.name}</span>
          </Link>
        )
      })}
    </div>
  )
} 