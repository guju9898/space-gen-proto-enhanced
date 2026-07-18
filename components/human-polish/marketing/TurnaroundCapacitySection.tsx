export function TurnaroundCapacitySection() {
  return (
    <section className="container mx-auto px-4 py-14" id="turnaround">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">Turnaround and capacity</h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Delivery dates are accepted based on current production capacity. Rush availability is confirmed before we
          promise the date.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-lg font-bold text-white mb-2">Standard delivery targets</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 25 concepts: 24–48 hours</li>
              <li>• 50 concepts: 48–72 hours</li>
              <li>• 100 concepts: 3–5 business days</li>
              <li>• Essentials 2D: 3–5 business days</li>
              <li>• Essentials 3D: 5–10 business days</li>
            </ul>
          </article>
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-lg font-bold text-white mb-2">When the clock starts</h3>
            <p className="text-sm text-muted-foreground">
              The delivery clock begins only after payment has been completed and the Renderspace team confirms that
              required files and instructions are complete and usable.
            </p>
          </article>
          <article className="rounded-xl border border-[#343434] bg-[#191f33]/50 p-8">
            <h3 className="text-lg font-bold text-white mb-2">Rush and fixed dates</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Rush cannot be promised automatically. If your presentation date is fixed, submit the intake early or
              request a quick capacity check.
            </p>
            <p className="text-xs text-muted-foreground">
              We do not use fake countdowns or invented scarcity. Capacity language reflects real production availability.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}
