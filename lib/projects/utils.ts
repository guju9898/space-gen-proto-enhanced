import type { ProjectType } from "./types"
import { PROJECT_TYPE_LABELS } from "./types"

export function formatProjectType(type: ProjectType): string {
  return PROJECT_TYPE_LABELS[type] ?? type
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} wk ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined })
}

export function downloadImage(url: string, filename: string): void {
  const a = document.createElement("a")
  a.href = url
  a.download = filename || "render.png"
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
