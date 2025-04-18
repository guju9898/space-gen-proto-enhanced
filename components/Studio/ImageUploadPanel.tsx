"use client"

import { Upload, X } from "lucide-react"
import Image from "next/image"

interface ImageUploadPanelProps {
  currentImage: string | null
  onUpload: (file: File) => void
  onRemove: () => void
  isUploading: boolean
}

export default function ImageUploadPanel({
  currentImage,
  onUpload,
  onRemove,
  isUploading,
}: ImageUploadPanelProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onUpload(file)
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <h3 className="text-lg font-medium text-white mb-4">Upload Reference Image</h3>
      
      {currentImage ? (
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <Image
            src={currentImage}
            alt="Uploaded reference"
            fill
            className="object-cover"
          />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      ) : (
        <label
          className={`flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer ${
            isUploading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isUploading}
          />
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <span className="text-muted-foreground text-sm">
            {isUploading ? "Uploading..." : "Click to upload or drag and drop"}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF up to 10MB
          </span>
        </label>
      )}
    </div>
  )
}
