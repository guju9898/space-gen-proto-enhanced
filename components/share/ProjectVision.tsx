type ProjectVisionProps = {
  /** Optional custom vision text; uses default placeholder if not provided */
  visionText?: string | null
}

const DEFAULT_VISION =
  "This concept illustrates a potential transformation of the space to improve usability, aesthetics, and functionality. The goal is to help visualize the direction of the project before construction begins."

export function ProjectVision({ visionText }: ProjectVisionProps) {
  const text = visionText?.trim() || DEFAULT_VISION

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <h2 className="text-lg font-semibold text-white/90 tracking-tight mb-4">
          Project Vision
        </h2>
        <p className="text-white/70 leading-relaxed">
          {text}
        </p>
      </div>
    </section>
  )
}
