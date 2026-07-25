import { RenderspaceBeforeAfterSlider } from "@/components/RenderspaceBeforeAfterSlider"

const PROOF_CATEGORIES = {
  landscape: {
    label: "Landscape",
    beforeSrc: "/images/before-landscape.webp",
    afterSrc: "/images/after-landscape.webp",
  },
  exterior: {
    label: "Exterior",
    beforeSrc: "/images/before-exterior.webp",
    afterSrc: "/images/after-exterior.webp",
  },
  interior: {
    label: "Interior",
    beforeSrc: "/images/before-interior.webp",
    afterSrc: "/images/after-interior.webp",
  },
} as const

export function ProofSection() {
  return (
    <section className="container mx-auto px-4 py-14" id="proof">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-3">
          Real Renderspace-produced work
        </h2>
        <p className="text-muted-foreground text-center max-w-3xl mx-auto mb-8">
          Examples of visualization produced by the Renderspace team. These before/after pairs illustrate the quality of
          the visualization model — they are not claimed as prior Human Polish package purchases unless separately
          stated.
        </p>
        <div className="max-w-4xl mx-auto">
          <RenderspaceBeforeAfterSlider
            categories={PROOF_CATEGORIES}
            categoryOrder={["landscape", "exterior", "interior"]}
          />
        </div>
      </div>
    </section>
  )
}
