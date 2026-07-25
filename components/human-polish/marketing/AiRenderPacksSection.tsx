export function AiRenderPacksSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="ai-render-packs">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">AI Render Packs</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Done-for-you concept generation. You do not need to learn prompting, generate images personally, or manage a
          freelancer. Complete the intake; the Renderspace team interprets the brief and delivers an organized package.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "One project, one property",
              body: "Each standard pack covers one project at one property. Separate properties typically require separate packs.",
            },
            {
              title: "Organized deliverables",
              body: "High-resolution PNG concepts (1080p minimum), an organized PDF, and optional contractor branding on the PDF.",
            },
            {
              title: "Commercial usage included",
              body: "Use delivered concepts for client presentations, proposals, mailers, ads, social, websites, and sales collateral.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.body}</p>
            </article>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          Packs must be used within <span className="text-white font-medium">90 days</span> of purchase. The delivery
          clock begins only after payment and after the Renderspace team confirms required files and instructions are
          complete and usable.
        </p>
      </div>
    </section>
  )
}
