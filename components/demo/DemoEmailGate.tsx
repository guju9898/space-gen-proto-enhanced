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
import { DEMO_EMAIL_COOKIE } from "@/lib/demo/usage"

export interface DemoEmailGateProps {
  open: boolean
  onContinue: (email: string) => void
}

export function DemoEmailGate({ open, onContinue }: DemoEmailGateProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) {
      setError("Please enter your email.")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Please enter a valid email address.")
      return
    }
    setError(null)
    if (typeof document !== "undefined") {
      document.cookie = `${DEMO_EMAIL_COOKIE}=${encodeURIComponent(trimmed)}; path=/; max-age=2592000`
    }
    onContinue(trimmed)
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Start the demo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Enter your email to generate your first render.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setError(null)
            }}
            className="bg-background"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">
            Start Demo
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
