"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalHeader } from "@/components/Studio/GlobalHeader"

/** Project detail placeholder. TODO: Load project + renders from Supabase; support shareSlug for /view/[shareSlug]. */
export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params?.projectId as string | undefined

  if (!projectId) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <GlobalHeader />
        <div className="container mx-auto px-6 py-8">
          <p className="text-muted-foreground">Invalid project.</p>
          <Button variant="link" asChild className="mt-2">
            <Link href="/studio/projects">Back to My Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GlobalHeader />
      <div className="border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/studio/projects" className="gap-1">
              <ChevronLeft className="h-4 w-4" />
              My Projects
            </Link>
          </Button>
        </div>
      </div>
      <main className="flex-1 container mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-foreground">Project detail</h1>
        <p className="mt-2 text-sm text-muted-foreground">Project ID: {projectId}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Full project view and render gallery will be implemented here. Future: shareable link via{" "}
          <code className="rounded bg-muted px-1">/view/[shareSlug]</code>.
        </p>
        <Button variant="outline" className="mt-6" onClick={() => router.push("/studio/projects")}>
          Back to My Projects
        </Button>
      </main>
    </div>
  )
}
