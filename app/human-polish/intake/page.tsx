import { Suspense } from "react"
import type { Metadata } from "next"
import { IntakeExperience } from "@/components/human-polish/intake/IntakeExperience"

export const metadata: Metadata = {
  title: "Start your request | Human Polish™ | Renderspace",
  description:
    "Complete the Human Polish guided intake: select a package, share your project brief, upload private files, and continue to secure checkout or scope review.",
  robots: { index: false, follow: false },
}

function IntakeFallback() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center text-sm text-muted-foreground">
        Loading your request…
      </div>
    </div>
  )
}

export default function HumanPolishIntakeRoute() {
  return (
    <Suspense fallback={<IntakeFallback />}>
      <IntakeExperience />
    </Suspense>
  )
}
