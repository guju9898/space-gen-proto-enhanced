"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload } from "lucide-react"
import Image from "next/image"

interface UploadImagePanelProps {
  onImageUpload: (file: File) => void
  acceptedFileTypes?: string[]
  maxFileSizeMB?: number
  uploadInstructions?: string
  currentImage?: string | null
  isUploading?: boolean
}

export default function UploadImagePanel({
  onImageUpload,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/jpg"],
  maxFileSizeMB = 8,
  uploadInstructions = "Click to upload or drag and drop\nPNG, JPG up to 8 MB",
  currentImage = null,
  isUploading = false,
}: UploadImagePanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError(`File type not supported. Please upload ${acceptedFileTypes.join(", ")}`)
      return false
    }

    // Check file size
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSizeMB}MB`)
      return false
    }

    setError(null)
    return true
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (validateFile(file)) {
        onImageUpload(file)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (validateFile(file)) {
        onImageUpload(file)
      }
    }
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className={`flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors ${
          isDragging ? "border-purple-500 bg-purple-500/10" : "border-zinc-700 hover:border-zinc-500"
        } ${currentImage ? "bg-zinc-900" : "bg-zinc-900/50"} cursor-pointer min-h-[240px]`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => handleClick()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes.join(",")}
          className="hidden"
          disabled={isUploading}
        />

        {currentImage ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImage || "/placeholder.svg"}
              alt="Uploaded image"
              fill
              className="object-contain rounded"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="w-8 h-8 mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-400 whitespace-pre-line">{uploadInstructions}</p>
            {isUploading && <p className="mt-4 text-sm text-purple-400">Uploading...</p>}
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

      {!currentImage && !isUploading && (
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => handleClick()}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-md transition-colors"
          >
            Upload image
          </button>
        </div>
      )}
    </div>
  )
}
