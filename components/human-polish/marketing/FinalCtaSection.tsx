import Link from "next/link"

interface FinalCtaSectionProps {
  onSelectPack: (packageId: "25" | "50" | "100") => void
  onSelectBuildReady: (packageId: "essentials-2d" | "essentials-3d" | "custom") => void
}

export function FinalCtaSection({ onSelectPack, onSelectBuildReady }: FinalCtaSectionProps) {
  return (
    <section className="container mx-auto px-4 py-16" id="final-cta">
      <div className="max-w-6xl mx-auto rounded-xl border border-[#343434] bg-gradient-to-r from-[#9747ff]/20 to-[#8608fd]/20 p-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
          Put a real production team behind your next presentation
        </h2>
        <p className="text-muted-foreground mb-8 max-w-3xl mx-auto">
          Explore with Renderspace when you want speed. Hand the brief to Human Polish when you need organized concepts
          or a Build-Ready presentation package produced for you.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            href="/human-polish/intake?family=ai-render-pack&package=25"
            onClick={() => onSelectPack("25")}
            className="inline-flex items-center justify-center bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Start 25-pack
          </Link>
          <Link
            href="/human-polish/intake?family=ai-render-pack&package=50"
            onClick={() => onSelectPack("50")}
            className="inline-flex items-center justify-center bg-[#191f33] hover:bg-[#232a45] transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Start 50-pack
          </Link>
          <Link
            href="/human-polish/intake?family=ai-render-pack&package=100"
            onClick={() => onSelectPack("100")}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Start 100-pack
          </Link>
          <Link
            href="/human-polish/intake?family=build-ready&package=essentials-2d"
            onClick={() => onSelectBuildReady("essentials-2d")}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Essentials 2D
          </Link>
          <Link
            href="/human-polish/intake?family=build-ready&package=essentials-3d"
            onClick={() => onSelectBuildReady("essentials-3d")}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Essentials 3D
          </Link>
          <Link
            href="/human-polish/intake?family=build-ready&package=custom"
            onClick={() => onSelectBuildReady("custom")}
            className="inline-flex items-center justify-center border border-white/30 hover:bg-white/10 transition-all text-white px-5 py-3 rounded-md font-medium"
          >
            Custom quote
          </Link>
        </div>
      </div>
    </section>
  )
}
