import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlobalHeader } from "@/components/Studio/GlobalHeader"
import { ProjectDetail } from "@/components/Studio/projects/ProjectDetail"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Project, ProjectRender, ProjectType } from "@/lib/projects/types"

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
  const { data: row } = await supabase
    .from("projects")
    .select("id, user_id, name, project_type, cover_image, share_slug, is_shared, presenting_on, created_at, updated_at")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!row) return <NotFound />

  const { data: renderRows } = await supabase
    .from("project_renders")
    .select("id, project_id, user_id, studio_type, image_url, thumbnail_url, source_image_url, prompt_summary, credits_used, created_at")
    .eq("project_id", row.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const renders: ProjectRender[] = (renderRows ?? []).map((r) => ({
    id: r.id,
    projectId: r.project_id,
    userId: r.user_id,
    studioType: r.studio_type as ProjectType,
    imageUrl: r.image_url,
    thumbnailUrl: r.thumbnail_url ?? null,
    sourceImageUrl: r.source_image_url ?? null,
    promptSummary: r.prompt_summary ?? null,
    creditsUsed: r.credits_used ?? null,
    createdAt: r.created_at,
  }))

  const project: Project = {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    projectType: row.project_type as ProjectType,
    coverImageUrl: row.cover_image ?? null,
    renderCount: renders.length,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    shareSlug: row.share_slug ?? null,
    isShared: Boolean(row.is_shared),
    presentingOn: row.presenting_on ?? null,
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
        <ProjectDetail project={project} renders={renders} />
      </main>
    </div>
  )
}
