"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Check } from "lucide-react"
import { createProspectMockup } from "@/app/studio/projects/actions"

export interface CreateMockupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  renderId: string | null
  onSuccess?: () => void
}

export function CreateMockupDialog({
  open,
  onOpenChange,
  renderId,
  onSuccess,
}: CreateMockupDialogProps) {
  const [prospectName, setProspectName] = useState("")
  const [propertyAddress, setPropertyAddress] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function getMockupUrl(): string {
    if (typeof window === "undefined" || !slug) return ""
    return `${window.location.origin}/mockup/${slug}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!renderId) return
    setLoading(true)
    setError(null)
    setSlug(null)
    try {
      const result = await createProspectMockup(renderId, {
        prospectName: prospectName.trim() || null,
        propertyAddress: propertyAddress.trim() || null,
        message: message.trim() || null,
      })
      if ("error" in result) {
        setError(result.error)
        return
      }
      setSlug(result.slug)
      onSuccess?.()
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    const url = getMockupUrl()
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Could not copy")
    }
  }

  function handleClose(open: boolean) {
    if (!open) {
      setSlug(null)
      setProspectName("")
      setPropertyAddress("")
      setMessage("")
      setError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create prospect mockup</DialogTitle>
        </DialogHeader>
        {!slug ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div>
              <Label htmlFor="prospect-name">Prospect name</Label>
              <Input
                id="prospect-name"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder="e.g. Jane Smith"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="property-address">Property address</Label>
              <Input
                id="property-address"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="e.g. 123 Main St"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="message">Message (optional)</Label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Short note for the prospect"
                rows={3}
                className="mt-1.5 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Creating…" : "Create mockup"}
              </Button>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">Your mockup is ready. Share this link:</p>
            <div className="flex gap-2">
              <Input readOnly value={getMockupUrl()} className="font-mono text-sm" />
              <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                <span className="sr-only">Copy</span>
              </Button>
            </div>
            <Button onClick={() => handleClose(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
