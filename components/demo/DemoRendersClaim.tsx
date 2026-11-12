"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FolderOpen, X } from "lucide-react"
import { useAuth } from "@/components/auth/AuthContext"
import { COOKIE_NAME } from "@/lib/demo/usage"
import { trackStudioEvent } from "@/components/Studio/analytics"

const TRIED_KEY = "rs_demo_claim_tried"

/**
 * Signed-in Studio visit from a browser that used the demo: moves the demo renders
 * into the account (POST /api/demo/claim) and says where they went.
 * Runs at most once per browser tab session; the server ignores renders already moved.
 */
export function DemoRendersClaim({ demoMode }: { demoMode?: boolean }) {
  const { status } = useAuth()
  const [result, setResult] = useState<{ claimed: number; projectId: string | null } | null>(null)

  useEffect(() => {
    if (demoMode || status !== "authenticated") return
    if (!document.cookie.includes(`${COOKIE_NAME}=`)) return
    try {
      if (sessionStorage.getItem(TRIED_KEY)) return
      sessionStorage.setItem(TRIED_KEY, "1")
    } catch {
      /* storage blocked: still try once per page load */
    }
    let cancelled = false
    fetch("/api/demo/claim", { method: "POST", credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { claimed?: number; projectId?: string | null } | null) => {
        if (cancelled || !data?.claimed) return
        setResult({ claimed: data.claimed, projectId: data.projectId ?? null })
        trackStudioEvent("demo_renders_claimed", { count: data.claimed })
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [demoMode, status])

  if (!result) return null
  const href = result.projectId ? `/studio/projects/${result.projectId}` : "/studio/projects"
  return (
    <div role="status" className="border-b border-border bg-primary/10 px-4 py-2 text-sm">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
        <span className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          Your {result.claimed} demo render{result.claimed === 1 ? " is" : "s are"} saved in a project called “Demo renders”.
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <Link href={href} className="font-medium underline underline-offset-2">
            Open
          </Link>
          <button type="button" aria-label="Dismiss" onClick={() => setResult(null)}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </span>
      </div>
    </div>
  )
}
