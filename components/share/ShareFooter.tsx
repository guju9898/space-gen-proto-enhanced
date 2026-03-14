import Link from "next/link"

export function ShareFooter() {
  return (
    <footer className="border-t border-white/10 bg-black/30 py-8 sm:py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-white/50">
          Concept visualization generated with{" "}
          <Link
            href="/"
            className="text-white/70 hover:text-white underline underline-offset-2 transition-colors"
          >
            Renderspace
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link
            href="/"
            className="text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            Create your own concepts with Renderspace
          </Link>
        </p>
      </div>
    </footer>
  )
}
