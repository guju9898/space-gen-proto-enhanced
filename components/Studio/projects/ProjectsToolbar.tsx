"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ProjectType, SortOption } from "@/lib/projects/types"
import { PROJECT_TYPE_LABELS } from "@/lib/projects/types"

export interface ProjectsToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  projectTypeFilter: string
  onProjectTypeFilterChange: (value: string) => void
  sort: SortOption
  onSortChange: (value: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
]

export function ProjectsToolbar({
  search,
  onSearchChange,
  projectTypeFilter,
  onProjectTypeFilterChange,
  sort,
  onSortChange,
}: ProjectsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>
      <div className="flex gap-3 flex-shrink-0">
        <Select value={projectTypeFilter} onValueChange={onProjectTypeFilterChange}>
          <SelectTrigger className="w-[140px] bg-background">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {PROJECT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => onSortChange(v as SortOption)}>
          <SelectTrigger className="w-[180px] bg-background">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
