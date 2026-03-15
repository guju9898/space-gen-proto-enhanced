import Image from "next/image"

const BEFORE_SRC = "/images/before-landscape.webp"
const AFTER_SRC = "/images/after-landscape.webp"

export function ExampleProject() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
          <Image
            src={BEFORE_SRC}
            alt="Job site photo"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 text-white text-xs font-medium">
            Before
          </span>
        </div>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden shadow-lg">
          <Image
            src={AFTER_SRC}
            alt="Generated concept render"
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
          <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded bg-black/60 text-white text-xs font-medium">
            Concept
          </span>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-4">
        Concept generated in seconds.
      </p>
    </section>
  )
}
