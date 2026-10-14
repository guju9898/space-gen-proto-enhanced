import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo/metadata"
import { Suspense } from "react"
import { BookDemoContent } from "@/components/book-demo/BookDemoContent"

export const metadata: Metadata = pageMetadata({
  path: "/book-demo",
  title: "Book a Demo for Outdoor Living Contractors",
  description:
    "Book a 30-minute Renderspace demo for landscaping and outdoor living contractors. Tell us about your business and pick a time that works for your team.",
})

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
