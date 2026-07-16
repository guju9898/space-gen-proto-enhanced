export function ReframeSection() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-primary text-sm font-semibold uppercase tracking-wide mb-3">New Sales Reality</p>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-10 md:mb-12">Stop Explaining. Start Showing.</h2>

        <div className="max-w-4xl mx-auto">
          {/* Zone A — tool description */}
          <div className="text-center">
            <div className="space-y-1.5 mb-10">
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">Renderspace is not design software.</p>
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                It&apos;s not a rendering tool you learn over six months.
              </p>
              <p className="text-xl md:text-2xl font-bold text-white leading-tight">
                It&apos;s a closing weapon you pull out during the estimate.
              </p>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              You take a photo of their yard. You upload it. In 30 seconds, they&apos;re looking at exactly what their
              backyard could become — lawn, pergola, flagstone, outdoor kitchen, all of it — photorealistic, on your
              phone, while you&apos;re sitting across from them at their kitchen table.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-3">Their body language changes.</p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-14 md:mb-16">
              They stop asking questions about price. They start asking when you can start.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-14 md:mb-16" aria-hidden="true">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-orange-500/50" />
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500/70" />
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-violet-600/50" />
          </div>

          {/* Zone B — differentiator */}
          <div className="rounded-xl bg-[#141824]/80 px-4 py-10 md:px-8 md:py-12">
            <p className="text-2xl md:text-3xl font-bold leading-snug bg-gradient-to-r from-orange-300 via-orange-200 to-violet-300 bg-clip-text text-transparent mb-10">
              Any foliage. Any stone. Any material. Any idea they describe out loud.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed mb-2">
              Most rendering tools give your clients a menu to pick from.
            </p>
            <p className="text-xl font-bold text-white mb-10">Renderspace gives them a conversation.</p>
            <p className="border-l-4 border-orange-500 bg-[#0c101c]/80 py-4 pl-5 pr-4 text-left text-lg italic text-muted-foreground leading-relaxed mb-10 rounded-r-lg">
              If a homeowner says &quot;I want something that feels like a Tuscan courtyard with drought-resistant plants
              and decomposed granite&quot; — you type that in. Thirty seconds later, they&apos;re looking at it.
            </p>
            <p className="mt-12 text-lg md:text-xl font-bold text-white leading-relaxed">
              That&apos;s not a feature. That&apos;s how you{" "}
              <span className="text-orange-300">close the client</span> who doesn&apos;t know what they want until they see it.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
