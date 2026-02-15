"use client"
import { Info } from "lucide-react"

interface StudioSidebarProps {
  onOpenTipsInfo: () => void
  activeTab?: "interior" | "exterior" | "landscape"
  onTabChange?: (tab: "interior" | "exterior" | "landscape") => void
}

export default function StudioSidebar({
  onOpenTipsInfo,
  activeTab = "interior",
  onTabChange = () => {},
}: StudioSidebarProps) {
  return (
    <div className="w-full md:w-64 p-4 md:border-r border-zinc-800">
      <div className="flex md:flex-col">
        {/* Tabs */}
        <div className="flex md:mb-6 w-full overflow-x-auto md:overflow-visible">
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium mr-2 md:mr-0 md:mb-2 ${
              activeTab === "interior" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            onClick={() => onTabChange("interior")}
          >
            Interior
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium mr-2 md:mr-0 md:mb-2 ${
              activeTab === "exterior" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            onClick={() => onTabChange("exterior")}
          >
            Exterior
          </button>
          <button
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === "landscape" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
            }`}
            onClick={() => onTabChange("landscape")}
          >
            Landscape
          </button>
        </div>

        {/* Current Selection */}
        <div className="hidden md:block">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium">Your current interior</h2>
            <button onClick={() => onOpenTipsInfo()} className="text-zinc-400 hover:text-white">
              <div className="flex items-center">
                <span className="mr-1 text-xs">Tips</span>
                <Info className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
