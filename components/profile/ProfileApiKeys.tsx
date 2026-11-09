"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { KeyRound, Loader2, Copy, Check, Trash2 } from "lucide-react"
import Link from "next/link"
import { API_RENDER_CREDIT_COST } from "@/lib/usage/creditCost"

type ApiKeyRow = {
  id: string
  name: string
  key_prefix: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

type CreatedKey = ApiKeyRow & { api_key: string; warning?: string }

function formatWhen(value: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function ProfileApiKeys({ eligible }: { eligible: boolean }) {
  const [loading, setLoading] = useState(true)
  const [keys, setKeys] = useState<ApiKeyRow[]>([])
  const [name, setName] = useState("Default")
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedKey | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!eligible) {
      setLoading(false)
      return
    }
    setError(null)
    try {
      const res = await fetch("/api/v1/keys", { credentials: "include" })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || "Could not load API keys")
        setKeys([])
        return
      }
      setKeys(Array.isArray(data.data) ? data.data : [])
    } catch {
      setError("Could not load API keys")
    } finally {
      setLoading(false)
    }
  }, [eligible])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setCreated(null)
    try {
      const res = await fetch("/api/v1/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Default" }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || "Could not create API key")
        return
      }
      setCreated(data as CreatedKey)
      setName("Default")
      await load()
    } catch {
      setError("Could not create API key")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this API key? Existing integrations using it will stop working.")) return
    setRevokingId(id)
    setError(null)
    try {
      const res = await fetch(`/api/v1/keys?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error?.message || "Could not revoke API key")
        return
      }
      if (created?.id === id) setCreated(null)
      await load()
    } catch {
      setError("Could not revoke API key")
    } finally {
      setRevokingId(null)
    }
  }

  const handleCopy = async () => {
    if (!created?.api_key) return
    await navigator.clipboard.writeText(created.api_key)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeKeys = keys.filter((k) => !k.revoked_at)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          API Keys
        </CardTitle>
        <CardDescription>
          Automate renders with the public API. Each successful API render uses{" "}
          <span className="text-foreground">{API_RENDER_CREDIT_COST} credits</span>.{" "}
          <Link href="/developers" className="underline hover:text-white">
            Developer docs
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!eligible ? (
          <p className="text-sm text-muted-foreground">
            API access requires an active Professional or Business plan.{" "}
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

            {created?.api_key && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                <p className="text-sm font-medium text-amber-200">
                  Copy your key now. It will not be shown again.
                </p>
                <div className="flex gap-2">
                  <code className="flex-1 overflow-x-auto rounded bg-black/40 px-3 py-2 text-xs text-zinc-100">
                    {created.api_key}
                  </code>
                  <Button type="button" variant="outline" size="icon" onClick={handleCopy} aria-label="Copy API key">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Key name"
                maxLength={80}
                className="sm:max-w-xs"
              />
              <Button type="button" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating…
                  </>
                ) : (
                  "Create API key"
                )}
              </Button>
            </div>

            {activeKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active API keys yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Prefix</th>
                      <th className="px-3 py-2 font-medium">Created</th>
                      <th className="px-3 py-2 font-medium">Last used</th>
                      <th className="px-3 py-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeKeys.map((key) => (
                      <tr key={key.id} className="border-t border-border">
                        <td className="px-3 py-2">{key.name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{key.key_prefix}…</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatWhen(key.created_at)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatWhen(key.last_used_at)}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={revokingId === key.id}
                            onClick={() => handleRevoke(key.id)}
                          >
                            {revokingId === key.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
                                Revoke
                              </>
                            )}
                          </Button>
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
