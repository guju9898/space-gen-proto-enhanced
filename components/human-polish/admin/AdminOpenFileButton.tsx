"use client"

import { useState, useTransition } from "react"
import { createAdminFileSignedUrl } from "@/lib/human-polish/admin-actions"
import { Button } from "@/components/ui/button"

export function AdminOpenFileButton({
  requestId,
  fileId,
  filename,
}: {
  requestId: string
  fileId: string
  filename: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        aria-label={`Open file ${filename}`}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const result = await createAdminFileSignedUrl({ requestId, fileId })
            if (!result.ok) {
              setError(result.error)
              return
            }
            window.open(result.url, "_blank", "noopener,noreferrer")
          })
        }}
      >
        {pending ? "Opening…" : "Open file"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
