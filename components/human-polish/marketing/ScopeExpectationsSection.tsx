import { REQUIRED_DISCLAIMER } from "./marketingConfig"

export function ScopeExpectationsSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="scope-expectations">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Scope expectations</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Human Polish does not replace architects, engineers, surveyors, landscape architects, or permit professionals.
        </p>
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-xl font-bold text-white mb-3">Included intent</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Visualization and client presentation</li>
              <li>• HOA / design-review support packages</li>
              <li>• Concept generation (AI Render Packs)</li>
              <li>• Human-produced presentation plans and views (Build-Ready)</li>
            </ul>
          </article>
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-xl font-bold text-white mb-3">Not included</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Architectural, structural, or engineering seals</li>
              <li>• Structural calculations or civil engineering</li>
              <li>• Code-compliance certification</li>
              <li>• Permit drawings, construction documents, or shop drawings</li>
              <li>• Guaranteed HOA or permit approval</li>
            </ul>
          </article>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="text-white font-medium">Required disclaimer: </span>
            {REQUIRED_DISCLAIMER}
          </p>
        </div>
      </div>
    </section>
  )
}
