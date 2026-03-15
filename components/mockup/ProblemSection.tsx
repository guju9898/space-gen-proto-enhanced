import { AlertCircle, XCircle, Clock, TrendingDown } from "lucide-react"

const PROBLEMS = [
  { icon: AlertCircle, text: "Clients hesitate to approve projects" },
  { icon: XCircle, text: "Scope changes cause delays" },
  { icon: Clock, text: "Traditional design takes too long" },
  { icon: TrendingDown, text: "Contractors lose bids" },
]

export function ProblemSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        Why contractors lose projects
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Clients struggle to visualize the final result.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {PROBLEMS.map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-start gap-4 bg-[#191f33]/50 p-6 rounded-xl"
          >
            <Icon className="w-5 h-5 flex-shrink-0 text-primary mt-0.5" />
            <span className="text-white">{text}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
