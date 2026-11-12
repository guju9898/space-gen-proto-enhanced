import { Camera, Send, Sparkles, ThumbsUp } from "lucide-react"

/** Homepage, spec section 3: the job flow in four steps. Describes the workflow, promises no outcome. */
const STEPS = [
  { icon: Camera, title: "Take the photo", body: "Stand where the homeowner stands at the walkthrough. A phone photo works." },
  { icon: Sparkles, title: "Render the idea", body: "Pick the pool, patio, plants or finishes, or type your own. About 30 seconds." },
  { icon: Send, title: "Send the link", body: "One button makes a view-only page with every version, ready to text or email." },
  { icon: ThumbsUp, title: "Agree the direction", body: "The client sees their own yard or home, so you talk about one design before you price it." },
]

export function PhotoToProposal() {
  return (
    <section className="container mx-auto px-4 py-16" aria-labelledby="p2p-heading">
      <h2 id="p2p-heading" className="text-2xl md:text-3xl font-bold mb-3 text-white text-center">
        From photo to proposal in one visit
      </h2>
      <p className="text-muted-foreground max-w-2xl mx-auto mb-10 text-center">
        Homeowners plan spring pools and patios over the winter. Show them the design while they&apos;re still choosing who will build it.
      </p>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
        {STEPS.map((step, i) => (
          <li key={step.title} className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-violet-700 text-sm font-bold text-white">
                {i + 1}
              </span>
              <step.icon className="h-5 w-5 text-orange-300" aria-hidden="true" />
            </div>
            <h3 className="mt-4 font-semibold text-white">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
