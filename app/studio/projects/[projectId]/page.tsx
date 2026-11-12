"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, Columns2, Download, ImageIcon, Pencil, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlobalHeader } from "@/components/Studio/GlobalHeader"
import { CompareSlider } from "@/components/Studio/CompareSlider"
import { RenameProjectDialog } from "@/components/Studio/projects/RenameProjectDialog"
import { ShareProjectDialog } from "@/components/Studio/projects/ShareProjectDialog"
import { useAuth } from "@/components/auth/AuthContext"
import { createClient } from "@/lib/supabase/client"
import { getProjectWithRenders } from "@/lib/projects/get-projects"
import { downloadImage, formatProjectType, formatRelativeDate } from "@/lib/projects/utils"
import { renameProject, enableProjectShare, disableProjectShare } from "@/app/studio/projects/actions"
import type { Project, ProjectRender } from "@/lib/projects/types"
import { cn } from "@/lib/utils"

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; project: Project; renders: ProjectRender[] }

/** One project: every saved version, newest first, with download, compare and share. */
export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = (params?.projectId as string | undefined) ?? ""
  const { status } = useAuth()
  const [state, setState] = useState<State>({ kind: "loading" })
  const [selected, setSelected] = useState<ProjectRender | null>(null)
  const [compare, setCompare] = useState<ProjectRender | null>(null)
  const [renaming, setRenaming] = useState(false)
  const [sharing, setSharing] = useState(false)

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await createClient().auth.getUser()
    const data = projectId ? await getProjectWithRenders(projectId) : null
    // Shared projects are readable by anyone; only the owner manages them here.
    if (!data || !user || data.project.userId !== user.id) {
      setState({ kind: "missing" })
      return
    }
    setState({ kind: "ready", project: data.project, renders: data.renders })
    setSelected((cur) => cur ?? data.renders[0] ?? null)
  }, [projectId])

  useEffect(() => {
    if (status === "initializing") return
    if (status === "unauthenticated") {
      setState({ kind: "missing" })
      return
    }
    void load()
  }, [status, load])

  const back = (
    <div className="border-b border-border">
      <div className="container mx-auto px-4 py-3 sm:px-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/studio/projects" className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            My Projects
          </Link>
        </Button>
      </div>
    </div>
  )

  if (state.kind !== "ready") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <GlobalHeader />
        {back}
        <main className="container mx-auto flex-1 px-4 py-8 sm:px-6">
          {state.kind === "loading" ? (
            <div className="space-y-4">
              <div className="h-7 w-64 animate-pulse rounded bg-muted" />
              <div className="aspect-[4/3] w-full max-w-3xl animate-pulse rounded-lg bg-muted" />
            </div>
          ) : (
            <p className="text-muted-foreground">
              This project wasn&apos;t found. It may have been deleted, or it belongs to another account.
            </p>
          )}
        </main>
      </div>
    )
  }

  const { project, renders } = state
  const main = selected ?? renders[0] ?? null

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <GlobalHeader />
      {back}
      <main className="container mx-auto flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold text-foreground">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatProjectType(project.projectType)} · {renders.length} version{renders.length === 1 ? "" : "s"} · updated{" "}
              {formatRelativeDate(project.updatedAt)}
              {project.isShared ? " · client link on" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setRenaming(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Rename
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setSharing(true)} disabled={!renders.length}>
              <Share2 className="h-4 w-4" aria-hidden="true" />
              {project.isShared ? "Client link" : "Send to client"}
            </Button>
          </div>
        </div>

        {renders.length === 0 ? (
          <div className="mt-8 flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-16 text-center">
            <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No renders in this project yet.</p>
            <Button asChild className="mt-4">
              <Link href={`/studio/${project.projectType}`}>Open the Studio</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
            {main && (
              <section aria-label="Selected version" className="space-y-3">
                <div className="mx-auto w-full max-w-[min(100%,calc((100dvh_-_16rem)*4/3))] overflow-hidden rounded-lg bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={main.imageUrl} alt={`${project.name}, version`} className="aspect-[4/3] w-full object-contain" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => downloadImage(main.imageUrl, `${project.name.replace(/[^a-z0-9-_]/gi, "_")}.png`)}
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    Download
                  </Button>
                  {main.sourceImageUrl && (
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => setCompare(main)}>
                      <Columns2 className="h-4 w-4" aria-hidden="true" />
                      Compare with photo
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground">Made {formatRelativeDate(main.createdAt)}</span>
                </div>
              </section>
            )}

            <section aria-label="All versions">
              <h2 className="mb-3 text-sm font-medium text-muted-foreground">All versions</h2>
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                {renders.map((r, i) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(r)}
                      aria-pressed={main?.id === r.id}
                      aria-label={`Version ${renders.length - i}`}
                      className={cn(
                        "block w-full overflow-hidden rounded-md border-2 bg-muted",
                        main?.id === r.id ? "border-primary" : "border-transparent hover:border-border"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.thumbnailUrl ?? r.imageUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </main>

      {compare?.sourceImageUrl && (
        <Dialog open onOpenChange={(open) => !open && setCompare(null)}>
          <DialogContent className="max-h-[95dvh] w-[95vw] max-w-4xl overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Photo and render</DialogTitle>
              <DialogDescription>Drag across the image, or use the slider, to compare.</DialogDescription>
            </DialogHeader>
            <CompareSlider beforeSrc={compare.sourceImageUrl} afterSrc={compare.imageUrl} />
          </DialogContent>
        </Dialog>
      )}

      <RenameProjectDialog
        project={renaming ? project : null}
        open={renaming}
        onOpenChange={setRenaming}
        onRename={async (id, name) => {
          const result = await renameProject(id, name)
          if (result.error) throw new Error(result.error)
          setState({ kind: "ready", project: { ...project, name }, renders })
          setRenaming(false)
        }}
      />
      <ShareProjectDialog
        project={sharing ? project : null}
        open={sharing}
        onOpenChange={setSharing}
        onEnableShare={async (id) => {
          const result = await enableProjectShare(id)
          if ("error" in result) return result
          setState({ kind: "ready", project: { ...project, isShared: true, shareSlug: result.slug }, renders })
          return { slug: result.slug }
        }}
        onDisableShare={async (id) => {
          const result = await disableProjectShare(id)
          if ("error" in result) return result
          setState({ kind: "ready", project: { ...project, isShared: false }, renders })
          return {}
        }}
      />
    </div>
  )
}
