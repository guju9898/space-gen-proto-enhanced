import Link from "next/link"
import { Button } from "@/components/ui/button"

type Props = {
  page: number
  pageSize: number
  total: number
  filters: Record<string, string | undefined>
}

function buildHref(page: number, filters: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value) params.set(key, value)
  }
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `/admin/human-polish?${qs}` : "/admin/human-polish"
}

export function AdminRequestPagination({ page, pageSize, total, filters }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  if (totalPages <= 1) {
    return (
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total} request{total === 1 ? "" : "s"}
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} asChild={page > 1}>
          {page > 1 ? (
            <Link href={buildHref(page - 1, filters)}>Previous</Link>
          ) : (
            <span>Previous</span>
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          asChild={page < totalPages}
        >
          {page < totalPages ? (
            <Link href={buildHref(page + 1, filters)}>Next</Link>
          ) : (
            <span>Next</span>
          )}
        </Button>
      </div>
    </div>
  )
}
