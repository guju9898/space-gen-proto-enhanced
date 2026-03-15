import Image from "next/image"

const STUDIOS = [
  {
    title: "Interior Studio",
    description: "Redesign rooms, finishes, and layouts from a single photo.",
    image: "/landing/renders/interior-hero-01.png",
  },
  {
    title: "Exterior Studio",
    description: "Transform facades, siding, and curb appeal.",
    image: "/landing/renders/exterior-hero-01.png",
  },
  {
    title: "Landscape Studio",
    description: "Visualize patios, plantings, and outdoor living spaces.",
    image: "/landing/renders/landscape-hero-01.png",
  },
]

export function StudioPreview() {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-8">
        Three studios. One workflow.
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Choose the right tool for the job — interior, exterior, or landscape.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STUDIOS.map(({ title, description, image }) => (
          <div key={title} className="bg-[#191f33]/50 rounded-xl overflow-hidden">
            <div className="relative aspect-[4/3]">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 33vw, 100vw"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
