import { Trees, Layout, Flame, Waves, Home } from "lucide-react"

const CASES = [
  { icon: Trees, label: "Landscape design" },
  { icon: Layout, label: "Patio upgrades" },
  { icon: Flame, label: "Outdoor kitchens" },
  { icon: Waves, label: "Pool installations" },
  { icon: Home, label: "Home remodels" },
]

export function UseCasesSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        Perfect for contractors who design:
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        From backyard makeovers to full remodels — show the result before you break ground.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {CASES.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-4 bg-[#191f33]/50 p-6 rounded-xl"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <span className="font-medium text-white">{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
