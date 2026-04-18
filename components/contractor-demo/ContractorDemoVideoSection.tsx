export function ContractorDemoVideoSection() {
  return (
    <section className="container mx-auto px-4 py-10 md:py-14">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 text-center">
          Watch What Happens When A Contractor Shows This On-Site.
        </h2>
        <div className="relative rounded-xl overflow-hidden border border-white/15 bg-black/60 aspect-video mb-4">
          <video
            src="/videos/contractor-demo/VSL_2_with_captions.mp4"
            controls
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm md:text-base text-muted-foreground text-center">
          This is what your next estimate could look like.
        </p>
      </div>
    </section>
  )
}

