const STEPS = [
  {
    step: "1",
    title: "Select your package",
    body: "Choose 25, 50, or 100 concepts — or a Build-Ready package. Your selection locks into the intake URL.",
  },
  {
    step: "2",
    title: "Complete the guided brief",
    body: "A prescriptive, step-by-step interview collects contact details, project scope, design objectives, must-haves, and avoids — without prompt engineering.",
  },
  {
    step: "3",
    title: "Upload private files",
    body: "Site photos, surveys, inspiration, HOA guidelines, logos, and supporting documents upload to private storage — not public URLs.",
  },
  {
    step: "4",
    title: "Review, acknowledge, and proceed",
    body: "Confirm deliverables, the 90-day pack period, and scope acknowledgments. AI Render Packs continue to secure checkout; Build-Ready submits for human scope review first.",
  },
]

export function IntakeHowItWorksSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="how-intake-works">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          How the interactive intake works
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-10">
          The intake replaces a long questionnaire with a guided design interview. Prefer to talk it through? A call or
          WhatsApp option stays available throughout.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((item) => (
            <article key={item.step} className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
              <p className="text-primary text-sm font-bold mb-2">Step {item.step}</p>
              <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
