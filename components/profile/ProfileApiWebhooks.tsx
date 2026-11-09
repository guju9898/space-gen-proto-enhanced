"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, Copy, Loader2, Pause, Play, Send, Trash2, Webhook } from "lucide-react"

type WebhookRow = {
  id: string
  url: string
  active: boolean
  created_at: string
}

type CreatedWebhook = WebhookRow & { secret: string }

type TestResult = { ok: boolean; text: string }

const MAX_WEBHOOKS = 5

function formatWhen(value: string) {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

/** Show host + path only: automation-tool URLs often carry a secret token in the path. */
function shortUrl(raw: string) {
  try {
    const u = new URL(raw)
    const path = u.pathname.length > 24 ? `${u.pathname.slice(0, 20)}…` : u.pathname
    return `${u.host}${path}`
  } catch {
    return raw
  }
}

function describeTest(data: { delivered?: boolean; receiver_status?: number | null; reason?: string }): TestResult {
  if (data.delivered) return { ok: true, text: `Delivered (receiver answered ${data.receiver_status})` }
  switch (data.reason) {
    case "non_2xx":
      return { ok: false, text: `Receiver answered ${data.receiver_status}. It must return a 2xx.` }
    case "timeout":
      return { ok: false, text: "Receiver did not answer within 8 seconds." }
    case "host_not_public":
      return { ok: false, text: "That host doesn't resolve to a public address." }
    default:
      return { ok: false, text: "Could not reach the receiver." }
  }
}

export function ProfileApiWebhooks({ eligible }: { eligible: boolean }) {
  const [loading, setLoading] = useState(true)
  const [hooks, setHooks] = useState<WebhookRow[]>([])
  const [url, setUrl] = useState("")
  const [creating, setCreating] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedWebhook | null>(null)
  const [copied, setCopied] = useState(false)
  const [tests, setTests] = useState<Record<string, TestResult>>({})
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eligible) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const res = await fetch("/api/v1/webhooks", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || "Could not load webhooks")
        setHooks([])
        return
      }
      setHooks(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError("Could not load webhooks")
    } finally {
      setLoading(false)
    }
  }, [eligible])

  useEffect(() => {
    void load()
  }, [load])

  const call = async (input: string, init: RequestInit, fallback: string) => {
    const res = await fetch(input, { credentials: "include", ...init })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data?.error?.message || fallback)
    return data
  }

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setCreated(null)
    try {
      const data = await call(
        "/api/v1/webhooks",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        },
        "Could not add webhook"
      )
      setCreated(data as CreatedWebhook)
      setUrl("")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add webhook")
    } finally {
      setCreating(false)
    }
  }

  const handleToggle = async (hook: WebhookRow) => {
    setBusyId(hook.id)
    setError(null)
    try {
      await call(
        `/api/v1/webhooks?id=${encodeURIComponent(hook.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: !hook.active }),
        },
        "Could not update webhook"
      )
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update webhook")
    } finally {
      setBusyId(null)
    }
  }

  const handleTest = async (hook: WebhookRow) => {
    setBusyId(hook.id)
    setError(null)
    try {
      const data = await call(
        `/api/v1/webhooks/test?id=${encodeURIComponent(hook.id)}`,
        { method: "POST" },
        "Could not send test"
      )
      setTests((t) => ({ ...t, [hook.id]: describeTest(data) }))
    } catch (e) {
      setTests((t) => ({ ...t, [hook.id]: { ok: false, text: e instanceof Error ? e.message : "Could not send test" } }))
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (hook: WebhookRow) => {
    if (!confirm("Delete this webhook? Renderspace will stop sending render events to it.")) return
    setBusyId(hook.id)
    setError(null)
    try {
      await call(`/api/v1/webhooks?id=${encodeURIComponent(hook.id)}`, { method: "DELETE" }, "Could not delete webhook")
      if (created?.id === hook.id) setCreated(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete webhook")
    } finally {
      setBusyId(null)
    }
  }

  const handleCopy = async () => {
    if (!created?.secret) return
    await navigator.clipboard.writeText(created.secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const atLimit = hooks.length >= MAX_WEBHOOKS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Webhooks
        </CardTitle>
        <CardDescription>
          Get a signed POST when an API render completes or fails. Works with n8n, Make and Zapier catch hooks.{" "}
          <Link href="/developers#webhooks" className="underline hover:text-white">
            How to verify
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!eligible ? (
          <p className="text-sm text-muted-foreground">
            Webhooks require an active Professional or Business plan.{" "}
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

            {created?.secret && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm font-medium text-amber-200">
                  Copy the signing secret now. It will not be shown again.
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 overflow-x-auto rounded bg-black/40 px-3 py-2 text-xs text-zinc-100">
                    {created.secret}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy signing secret">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-n8n.example.com/webhook/…"
                aria-label="Webhook URL"
                className="sm:max-w-md"
                disabled={atLimit}
              />
              <Button type="button" onClick={handleCreate} disabled={creating || atLimit || !url.trim()}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Adding…
                  </>
                ) : (
                  "Add webhook"
                )}
              </Button>
            </div>
            {atLimit && (
              <p className="text-xs text-muted-foreground">Limit of {MAX_WEBHOOKS} webhooks reached. Delete one to add another.</p>
            )}

            {hooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No webhooks yet. HTTPS URLs only.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">URL</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {hooks.map((hook) => (
                      <tr key={hook.id} className="border-t border-border align-top">
                        <td className="px-3 py-2">
                          <span className="font-mono text-xs" title={hook.url}>
                            {shortUrl(hook.url)}
                          </span>
                          {tests[hook.id] && (
                            <p
                              className={`mt-1 text-xs ${tests[hook.id].ok ? "text-emerald-400" : "text-destructive"}`}
                              role="status"
                            >
                              {tests[hook.id].text}
                            </p>
                          )}
                        </td>
                        <td className={`px-3 py-2 ${hook.active ? "text-emerald-400" : "text-muted-foreground"}`}>
                          {hook.active ? "Active" : "Paused"}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatWhen(hook.created_at)}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            {busyId === hook.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground m-2" />
                            ) : (
                              <>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleTest(hook)}>
                                  <Send className="h-4 w-4 mr-1" />
                                  Test
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => handleToggle(hook)}>
                                  {hook.active ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-1" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-1" />
                                      Resume
                                    </>
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(hook)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
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
