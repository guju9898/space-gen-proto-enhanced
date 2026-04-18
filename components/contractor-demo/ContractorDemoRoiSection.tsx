import RoiCalculator from "@/components/RoiCalculator"

export function ContractorDemoRoiSection() {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="max-w-4xl mx-auto text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">How Much Is This Worth To You?</h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-3xl mx-auto">
          If one extra backyard project closes because your client can finally see the outcome, what does that add up
          to over a month?
        </p>
      </div>
      <RoiCalculator ctaHref="/studio/exterior?demo=true" ctaLabel="Try the free demo" />
    </section>
  )
}
