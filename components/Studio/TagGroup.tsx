import { LucideIcon } from "lucide-react"
import { Tag } from "./StudioPageLayout"

interface TagGroupProps {
  title: string
  icon?: LucideIcon
  tags: {
    label: string
    value: string
    icon?: LucideIcon
    required?: boolean
    onRemove?: () => void
  }[]
}

export function TagGroup({ title, icon: Icon, tags }: TagGroupProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{title}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag
            key={tag.label}
            label={tag.label}
            value={tag.value}
            icon={tag.icon}
            required={tag.required}
            onRemove={tag.onRemove}
          />
        ))}
      </div>
    </div>
  )
} 