import type { SharedProject } from "@/types/share-project"

export interface ProjectHeaderProps {
  project: SharedProject
  /** Callback to trigger download of project assets (e.g. first render or zip) */
  onDownload?: () => void
}

export function ProjectHeader({ project, onDownload }: ProjectHeaderProps) {
  const contractorName = project.contractor?.name ?? project.contractor?.company ?? null

  return (
    <header className="border-b border-white/10 bg-black/40 backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight truncate">
              {project.name}
            </h1>
            {contractorName && (
              <p className="mt-1 text-sm text-white/70">
                {contractorName}
              </p>
            )}
            {project.address && (
              <p className="mt-0.5 text-sm text-white/50 truncate">
                {project.address}
              </p>
            )}
          </div>
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Download
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
