"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, ExternalLink, Loader2 } from "lucide-react"
import Link from "next/link"

type UsageRow = {
  id: string
  status: "queued" | "running" | "completed" | "failed" | string
  space_type: string
  credits_charged: number | null
  created_at: string
  image_url: string | null
}

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function formatCredits(value: number | null) {
  if (value == null) return "—"
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function statusClass(status: string) {
  switch (status) {
    case "completed":
      return "text-emerald-400"
    case "failed":
      return "text-destructive"
    case "running":
    case "queued":
      return "text-amber-300"
    default:
      return "text-muted-foreground"
  }
}

export function ProfileApiUsage({ eligible }: { eligible: boolean }) {
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<UsageRow[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eligible) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const res = await fetch("/api/v1/usage?limit=20", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || "Could not load API usage")
        setRows([])
        return
      }
      setRows(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError("Could not load API usage")
    } finally {
      setLoading(false)
    }
  }, [eligible])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          API Usage
        </CardTitle>
        <CardDescription>
          Recent renders created through the public API.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!eligible ? (
          <p className="text-sm text-muted-foreground">
            API usage history is available on an active Professional or Business plan.{" "}
            <Link href="/pricing" className="underline hover:text-white">
              View pricing
            </Link>
          </p>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
            )}

            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No API renders yet. Create a key above and call{" "}
                <code className="text-xs">POST /api/v1/renders</code>.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Space</th>
                      <th className="px-3 py-2 font-medium">Credits</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium">Render</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className={`px-3 py-2 capitalize ${statusClass(row.status)}`}>{row.status}</td>
                        <td className="px-3 py-2 capitalize">{row.space_type}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatCredits(row.credits_charged)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatWhen(row.created_at)}</td>
                        <td className="px-3 py-2">
                          {row.image_url ? (
                            <a
                              href={row.image_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 underline hover:text-white"
                            >
                              Open
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="font-mono text-xs text-muted-foreground" title={row.id}>
                              {row.id.slice(0, 8)}…
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
