import { ImageIcon } from "lucide-react"
import { Tips } from "./Tips"

interface PreviewCardProps {
  imageUrl?: string
  label: string
  tips?: string
}

export function PreviewCard({ imageUrl, label, tips }: PreviewCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{label}</h3>
          {tips && <Tips content={tips} />}
        </div>
      </div>
      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Current interior"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <p className="text-sm">Upload an image</p>
          </div>
        )}
      </div>
    </div>
  )
} 