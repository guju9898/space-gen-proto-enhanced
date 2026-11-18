import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalHeader } from "@/components/Studio/GlobalHeader"
import { ProjectDetail } from "@/components/Studio/projects/ProjectDetail"
import { loadOwnedProject } from "@/lib/projects/loadOwnedProject"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <GlobalHeader />
      <main className="flex-1 container mx-auto px-6 py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Project not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          It may have been deleted, or it isn&apos;t in your account.
        </p>
        <Button asChild className="mt-6">
          <Link href="/studio/projects">Back to My Projects</Link>
        </Button>
      </main>
    </div>
  )
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return <NotFound />

  // Owner only: a project someone else shared is viewable at /view/[slug], never managed here.
  const owned = await loadOwnedProject(supabase, user.id, projectId)
  if (!owned) return <NotFound />

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
        <ProjectDetail project={owned.project} renders={owned.renders} />
      </main>
    </div>
  )
}
