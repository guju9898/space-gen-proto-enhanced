import RoiCalculator from "@/components/RoiCalculator"

export function ContractorDemoRoiSection() {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="max-w-6xl mx-auto text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">You&apos;ve Already Lost More Than This Costs.</h2>
        <div className="text-muted-foreground text-base md:text-lg max-w-4xl mx-auto space-y-4">
          <p>Think about the last three estimates where the client said they&apos;d &quot;think about it&quot; and never signed.</p>
          <p>One of those jobs — just one — would have paid for Renderspace for years.</p>
          <p>Run the math on your own numbers:</p>
        </div>
      </div>
      <RoiCalculator ctaHref="/studio/exterior?demo=true" ctaLabel="Try the free demo" />
      <p className="max-w-6xl mx-auto text-center text-sm text-muted-foreground mt-6 px-4">
        Most contractors who run this stop thinking about the monthly cost immediately. They start thinking about which
        estimate they&apos;re using this on first.
      </p>
    </section>
  )
}
