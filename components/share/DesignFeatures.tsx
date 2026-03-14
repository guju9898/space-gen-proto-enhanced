import { Check } from "lucide-react"

export interface DesignFeaturesProps {
  /** List of feature bullets; if empty or not provided, section still renders with placeholder or nothing */
  features?: string[] | null
}

const PLACEHOLDER_FEATURES = [
  "Updated layout and flow",
  "Enhanced materials and finishes",
  "Improved lighting and atmosphere",
  "Refined details and functionality",
]

export function DesignFeatures({ features }: DesignFeaturesProps) {
  const list = features?.length ? features : PLACEHOLDER_FEATURES

  return (
    <section className="py-12 sm:py-16 border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-6">
          Design Highlights
        </h2>
        <ul className="space-y-3">
          {list.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-white/70">
              <Check className="h-5 w-5 flex-shrink-0 text-white/50 mt-0.5" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
