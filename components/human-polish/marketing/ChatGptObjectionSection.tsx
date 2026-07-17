const ROWS: { feature: string; chatgpt: string; humanPolish: string }[] = [
  {
    feature: "Who does the work",
    chatgpt: "You prompt, iterate, and sort",
    humanPolish: "Renderspace production team",
  },
  {
    feature: "Briefing",
    chatgpt: "You invent prompts",
    humanPolish: "Prescriptive interactive intake",
  },
  {
    feature: "Deliverable",
    chatgpt: "Loose images you organize",
    humanPolish: "Organized PNG set + branded PDF option",
  },
  {
    feature: "First-batch process",
    chatgpt: "None",
    humanPolish: "Defined first batch before remaining pack",
  },
  {
    feature: "Accountability",
    chatgpt: "You own the output quality",
    humanPolish: "Human team + brief-match guarantee",
  },
  {
    feature: "Best for",
    chatgpt: "Personal exploration",
    humanPolish: "Throughput when you need it done for you",
  },
]

export function ChatGptObjectionSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="chatgpt-objection">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          “I can do this myself with ChatGPT”
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          You can — and Renderspace self-serve remains available when you want to explore personally. Human Polish is
          for when you are buying time, throughput, organization, and human accountability instead of spending nights
          prompting, correcting, and assembling a client-ready package.
        </p>

        <div className="relative max-w-6xl mx-auto">
          <div className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500/40 via-violet-700/40 to-sky-500/40 opacity-40 blur-xl" />
          <div className="relative rounded-2xl bg-[#050816]/80 border border-[#343434] p-4 md:p-6 overflow-x-auto">
            <table className="min-w-[640px] w-full text-sm md:text-base border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    What you need
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white">
                    Generic AI tools
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white bg-gradient-to-b from-orange-500/20 via-violet-700/15 to-transparent border border-orange-500/40 rounded-lg">
                    Human Polish™
                  </th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.feature} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{row.feature}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.chatgpt}</td>
                    <td className="px-4 py-3 text-white">{row.humanPolish}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          Generic AI tools can produce an image. Human Polish manages a deliverable — brief, production team, first-batch
          check, and organized handoff.
        </p>
      </div>
    </section>
  )
}
