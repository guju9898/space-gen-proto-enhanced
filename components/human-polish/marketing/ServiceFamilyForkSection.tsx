interface ServiceFamilyForkSectionProps {
  onSelectFamily: (family: "ai-render-pack" | "build-ready") => void
}

export function ServiceFamilyForkSection({ onSelectFamily }: ServiceFamilyForkSectionProps) {
  return (
    <section className="container mx-auto px-4 py-14" id="service-families">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Two ways to get professional visualization done for you
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Renderspace is rapid self-serve exploration. Human Polish is the professional service layer when you want
          concepts produced for you — or a more accurate presentation package.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-2">Service Family A</p>
            <h3 className="text-2xl font-bold text-white mb-3">AI Render Packs</h3>
            <p className="text-muted-foreground mb-6">
              Complete a prescriptive intake. The Renderspace team generates 25, 50, or 100 organized design concepts —
              no prompting, sorting, or freelancer management on your side.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• High-resolution PNG files + organized PDF</li>
              <li>• First-batch check before the rest of the pack</li>
              <li>• Direct checkout after intake</li>
            </ul>
            <a
              href="#ai-render-packs"
              onClick={() => onSelectFamily("ai-render-pack")}
              className="inline-flex w-full items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Choose a Render Pack
            </a>
          </article>

          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-2">Service Family B</p>
            <h3 className="text-2xl font-bold text-white mb-3">Build-Ready Packages</h3>
            <p className="text-muted-foreground mb-6">
              Start from an approved concept. The Renderspace team produces professional 2D plans and, when purchased,
              human-produced photorealistic renderings for client and HOA/design-review presentations.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              <li>• Human scope review before payment</li>
              <li>• Essentials 2D, Essentials 3D, or Custom</li>
              <li>• Built from your survey, photos, and specs</li>
            </ul>
            <a
              href="#build-ready"
              onClick={() => onSelectFamily("build-ready")}
              className="inline-flex w-full items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
            >
              Explore Build-Ready
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
