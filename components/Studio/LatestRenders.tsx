import { Download, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Render {
  id: string
  imageUrl: string
  timestamp: string
}

interface LatestRendersProps {
  renders: Render[]
}

export function LatestRenders({ renders }: LatestRendersProps) {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Latest renders</h3>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View all
        </Button>
      </div>
      {renders.length === 0 ? (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            You don't have any generated images yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {renders.map((render) => (
            <div key={render.id} className="group relative aspect-square">
              <img
                src={render.imageUrl}
                alt={`Render ${render.id}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button variant="ghost" size="icon" className="text-white">
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-white">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 