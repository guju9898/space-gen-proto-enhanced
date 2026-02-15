"use client"

import { Info } from "lucide-react"
import UploadImagePanel from "./UploadImagePanel"
import StudioSidebar from "./StudioSidebar"

interface StudioEmptyStateProps {
  onImageUpload: (file: File) => void
  onRenderDesign: () => void
  onOpenRequestInfo: () => void
  onOpenTipsInfo: () => void
  isUploading?: boolean
  currentImage?: string | null
  emptyStateText?: string
}

export default function StudioEmptyState({
  onImageUpload,
  onRenderDesign,
  onOpenRequestInfo,
  onOpenTipsInfo,
  isUploading = false,
  currentImage = null,
  emptyStateText = "You don't have any generated image yet",
}: StudioEmptyStateProps) {
  return (
    <div className="flex flex-col md:flex-row h-full bg-black text-white">
      {/* Left Sidebar */}
      <StudioSidebar onOpenTipsInfo={onOpenTipsInfo} />

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto">
        <div className="flex flex-col h-full">
          {/* Empty State Content */}
          <div className="flex items-center justify-center mb-4 text-zinc-400">
            <Info className="w-5 h-5 mr-2" />
            <p className="text-sm">{emptyStateText}</p>
          </div>

          {/* Upload Panel */}
          <div className="flex-1 mb-6">
            <UploadImagePanel onImageUpload={onImageUpload} currentImage={currentImage} isUploading={isUploading} />
          </div>

          {/* Design Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-3">Room type</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="relative min-w-[100px] cursor-pointer">
                  <div className="rounded-lg overflow-hidden border-2 border-purple-500">
                    <img src="/studio/bedroom-thumbnail.jpg" alt="Bedroom" className="w-full h-[60px] object-cover" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Bedroom
                  </div>
                </div>
                <div className="relative min-w-[100px] cursor-pointer">
                  <div className="rounded-lg overflow-hidden border-2 border-transparent">
                    <img
                      src="/studio/living-room-thumbnail.jpg"
                      alt="Living Room"
                      className="w-full h-[60px] object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Living Room
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">Design style</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                <div className="relative min-w-[100px] cursor-pointer">
                  <div className="rounded-lg overflow-hidden border-2 border-transparent">
                    <img src="/studio/modern-thumbnail.jpg" alt="Modern" className="w-full h-[60px] object-cover" />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Modern
                  </div>
                </div>
                <div className="relative min-w-[100px] cursor-pointer">
                  <div className="rounded-lg overflow-hidden border-2 border-purple-500">
                    <img
                      src="/studio/industrial-thumbnail.jpg"
                      alt="Industrial"
                      className="w-full h-[60px] object-cover"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Industrial
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Selection Dropdowns */}
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Composition</h3>
              <div className="relative">
                <select className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 appearance-none text-white">
                  <option>Select composition</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Mood</h3>
              <div className="relative">
                <select className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 appearance-none text-white">
                  <option>Select mood</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Color palette</h3>
              <div className="relative">
                <select className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 appearance-none text-white">
                  <option>Select color</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Lighting</h3>
              <div className="relative">
                <select className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-4 py-2 appearance-none text-white">
                  <option>Select lighting</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg
                    className="h-5 w-5 text-zinc-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Render Button */}
          <div className="mt-auto">
            <button
              onClick={() => onRenderDesign()}
              disabled={!currentImage}
              className={`w-full py-3 rounded-md flex items-center justify-center gap-2 transition-colors ${
                currentImage
                  ? "bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 text-white"
                  : "bg-zinc-800 text-zinc-400 cursor-not-allowed"
              }`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
              >
                <path
                  d="M12 2L2 7L12 12L22 7L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Render design
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-full md:w-80 p-4 md:p-6 border-t md:border-t-0 md:border-l border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium">Request</h2>
          <button onClick={() => onOpenRequestInfo()} className="text-zinc-400 hover:text-white">
            <Info className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-zinc-400">You don't have any request yet</p>
      </div>
    </div>
  )
}
