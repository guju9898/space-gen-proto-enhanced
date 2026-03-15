import { Upload, Sparkles, Eye, CheckCircle } from "lucide-react"

const STEPS = [
  { icon: Upload, title: "Upload job site photo", description: "Drop a photo from the site or a reference image." },
  { icon: Sparkles, title: "Generate concept render", description: "AI creates a photorealistic design in seconds." },
  { icon: Eye, title: "Show client the vision", description: "Share the result on the spot or via link." },
  { icon: CheckCircle, title: "Close the project", description: "Win on clarity and confidence." },
]

export function HowItWorks() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
        How it works
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                {i + 1}
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <h3 className="font-bold text-white mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
