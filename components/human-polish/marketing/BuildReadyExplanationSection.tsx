export function BuildReadyExplanationSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="build-ready">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Build-Ready Packages</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Build-Ready begins with an approved concept and produces professional presentation materials based on the
          files and information you supply. All Build-Ready requests require human review before payment and production.
        </p>

        <div className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8 mb-8">
          <p className="text-xs uppercase tracking-wide font-semibold text-primary mb-3">Public flow</p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
            <li>
              <span className="text-white font-medium">1. Select package</span>
              <br />
              Essentials 2D, Essentials 3D, or Custom
            </li>
            <li>
              <span className="text-white font-medium">2. Complete intake</span>
              <br />
              Upload survey, site photos, and references
            </li>
            <li>
              <span className="text-white font-medium">3. Human scope review</span>
              <br />
              Standard approval or custom quote
            </li>
            <li>
              <span className="text-white font-medium">4. Checkout &amp; production</span>
              <br />
              Payment only after scope is approved
            </li>
          </ol>
        </div>

        <p className="text-center text-sm text-muted-foreground max-w-3xl mx-auto">
          Human-produced plans and visuals based on the approved concept and project information you provide. Output
          accuracy depends on your survey, photos, dimensions, and specifications — not unconditional guarantees.
        </p>
      </div>
    </section>
  )
}
