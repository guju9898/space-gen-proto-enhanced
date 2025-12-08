import { ImageIcon, Upload } from "lucide-react"
import { Tips } from "./Tips"
import { Button } from "@/components/ui/button"
import { getImageSrc, getImageFallback } from "@/lib/images/getImageSrc"

interface PreviewCardProps {
  imageUrl?: string
  label: string
  tips?: string
  onUpload?: (file: File) => void
}

export function PreviewCard({ imageUrl, label, tips, onUpload }: PreviewCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{label}</h3>
          {tips && <Tips content={tips} />}
        </div>
      </div>
      
      <div className="aspect-video bg-muted rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 p-6">
        {imageUrl ? (
          <img
            src={getImageSrc(imageUrl)}
            alt="Current interior"
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getImageFallback(imageUrl);
            }}
          />
        ) : (
          <>
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              PNG, JPG up to 10MB
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/png,image/jpeg'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file && onUpload) onUpload(file)
                }
                input.click()
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
          </>
        )}
      </div>
    </div>
  )
} 