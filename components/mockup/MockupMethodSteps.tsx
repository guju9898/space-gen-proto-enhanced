import { Upload, Sparkles, Presentation, Trophy } from "lucide-react"

const STEPS = [
  { icon: Upload, title: "Upload project photo", description: "Drop a job site or reference photo." },
  { icon: Sparkles, title: "Generate concept render", description: "AI creates a photorealistic concept in seconds." },
  { icon: Presentation, title: "Show client instantly", description: "Share the vision before leaving the site." },
  { icon: Trophy, title: "Win the project", description: "Close on confidence, not guesswork." },
]

export function MockupMethodSteps() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        The Mockup Method
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Four steps to turn every estimate into a visual proposal.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map(({ icon: Icon, title, description }, i) => (
          <div key={title} className="bg-[#191f33]/50 p-6 rounded-xl">
            <div className="flex gap-4 mb-4">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/20 text-primary flex-shrink-0">
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
