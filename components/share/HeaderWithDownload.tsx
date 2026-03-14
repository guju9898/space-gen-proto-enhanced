"use client"

import { ProjectHeader } from "./ProjectHeader"
import type { SharedProject } from "@/types/share-project"

export interface HeaderWithDownloadProps {
  project: SharedProject
  firstRenderUrl: string
}

function downloadImage(url: string, filename: string) {
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function HeaderWithDownload({
  project,
  firstRenderUrl,
}: HeaderWithDownloadProps) {
  const handleDownload = () => {
    const name = `${project.name.replace(/[^a-z0-9-_]/gi, "_")}.png`
    downloadImage(firstRenderUrl, name)
  }

  return (
    <ProjectHeader project={project} onDownload={handleDownload} />
  )
}
