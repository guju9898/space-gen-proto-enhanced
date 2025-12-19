"use client"

import { useState } from "react"
import DesignControlsPanel from "@/components/Studio/Variables/DesignControlsPanel"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"

export default function VariablesClientPage() {
  if (typeof window === "undefined") return null;
  const [designType, setDesignType] = useState<"interior" | "exterior" | "landscape">("interior")

  const handleGenerateDesign = (config: any) => {
    console.log("Generating design with config:", config)
    // In a real app, this would call an API to generate the design
  }

  return (
    <DesignConfigProvider>
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center">
            <div className="flex items-center mr-8">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-pink-500 rounded mr-2"></div>
              <span className="font-bold">Space Gen</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="/studio" className="text-purple-400">
                Studio
              </a>
              <a href="/projects" className="text-zinc-400 hover:text-white">
                My projects
              </a>
              <a href="/subscription" className="text-zinc-400 hover:text-white">
                Subscription
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm mr-1">EN</span>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="flex items-center">
              <span className="text-sm mr-1">1/8</span>
            </div>
            <div className="bg-zinc-800 rounded-full h-8 w-8 flex items-center justify-center">
              <span className="text-sm">M</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-col md:flex-row h-[calc(100vh-64px)]">
          {/* Left Sidebar */}
          <div className="w-full md:w-64 p-4 md:border-r border-zinc-800">
            <div className="flex md:flex-col">
              {/* Tabs */}
              <div className="flex md:mb-6 w-full overflow-x-auto md:overflow-visible">
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium mr-2 md:mr-0 md:mb-2 ${
                    designType === "interior" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  onClick={() => setDesignType("interior")}
                >
                  Interior
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium mr-2 md:mr-0 md:mb-2 ${
                    designType === "exterior" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  onClick={() => setDesignType("exterior")}
                >
                  Exterior
                </button>
                <button
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    designType === "landscape" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                  onClick={() => setDesignType("landscape")}
                >
                  Landscape
                </button>
              </div>

              {/* Current Selection */}
              <div className="hidden md:block">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium">Your current {designType}</h2>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <DesignControlsPanel designType={designType} onGenerateDesign={handleGenerateDesign} />
          </div>

          {/* Right Sidebar */}
          <div className="w-full md:w-80 p-4 md:p-6 border-t md:border-t-0 md:border-l border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">Request</h2>
              <button className="text-zinc-400 hover:text-white">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-zinc-400">Selected variables will appear here as you make choices.</p>
              <div className="bg-zinc-900/50 rounded-lg p-4">
                <p className="text-xs text-zinc-500">
                  Your selections will be used to generate a custom design based on your preferences.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </DesignConfigProvider>
  )
}

