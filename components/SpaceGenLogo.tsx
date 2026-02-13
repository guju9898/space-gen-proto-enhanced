import Link from "next/link"
import { cn } from "@/lib/utils"

export default function SpaceGenLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className={cn("rounded-full bg-primary", className ?? "w-8 h-8")} />
      <span className="text-xl font-bold">Space Gen</span>
    </Link>
  )
} 