export function GuaranteeSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="guarantee">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
        <p className="text-primary text-xs uppercase tracking-wide font-semibold mb-2">Risk reversal</p>
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">First-Batch Brief-Match Guarantee</h2>
        <p className="text-muted-foreground mb-6 max-w-4xl">
          Renderspace produces the first 5, 10, or 15 concepts before completing the remaining pack. If that first batch
          materially fails to follow the written brief the customer approved, the customer may notify Renderspace within
          24 hours. Renderspace will correct the direction once at no additional charge before producing the remaining
          concepts.
        </p>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-white font-semibold mb-2">Covered</p>
            <p className="text-muted-foreground">
              Failure to follow the approved written brief on the first batch.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold mb-2">Not covered</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• A new property or new design direction</li>
              <li>• New client requirements after approval</li>
              <li>• A change of mind or new must-haves</li>
              <li>• Additional variations beyond the purchased pack</li>
            </ul>
          </div>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          AI Render Packs do not include open-ended revision rounds. Build-Ready packages include defined combined
          revision rounds (two for Essentials 2D; three for Essentials 3D). A new design direction is not a revision.
        </p>
      </div>
    </section>
  )
}
