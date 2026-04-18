import type { Metadata } from "next"
import { Suspense } from "react"
import { BookDemoContent } from "@/components/book-demo/BookDemoContent"

export const metadata: Metadata = {
  title: "Book a Demo | Premium Renderspace | Contractors",
  description:
    "Book a 30-minute demo of the Renderspace premium system for landscaping and outdoor living contractors. Tell us about your business and schedule a call.",
}

function BookDemoFallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">
      Loading…
    </div>
  )
}

export default function BookDemoPage() {
  return (
    <Suspense fallback={<BookDemoFallback />}>
      <BookDemoContent />
    </Suspense>
  )
}
