export function HoaSupportSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="hoa-support">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">HOA / design-review support</h2>
        <p className="text-muted-foreground mb-6 max-w-3xl">
          Human Polish can produce an HOA submission-ready presentation package — designed to support HOA and
          design-review submissions with human-produced plans and visuals based on the property survey, approved
          concept, and project information you supply.
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-white font-semibold mb-2">What we support</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Client and board presentation packages</li>
              <li>• Clear concept communication for design review</li>
              <li>• Organized visuals aligned to your supplied survey and specs</li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">What we do not claim</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Guaranteed HOA approval</li>
              <li>• Permit-ready or stamped plans</li>
              <li>• Construction documents or sealed drawings</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
