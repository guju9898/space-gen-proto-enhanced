"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Camera, Lightbulb, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudioV2 } from "@/components/Studio/StudioV2Context"
import { trackStudioEvent } from "@/components/Studio/analytics"
import {
  GUIDE_RESET_EVENT,
  HINT_IDS,
  HINT_STORAGE_PREFIX,
  PHOTO_WARNING_TEXT,
  TRADES,
  TRADE_STORAGE_KEY,
  demoRendersLeftText,
  isTradeAnswered,
  meanBrightness,
  photoWarnings,
  renderCostText,
  type HintId,
  type PhotoWarning,
} from "@/lib/studio/onboarding"

const PHOTO_GUIDE_HREF = "/academy/photographing-a-job-site"

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    /* private mode: the hint just shows again next visit */
  }
}

/** A tip that shows once per browser until dismissed; the Guide button brings it back. */
export function useHint(id: HintId) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setVisible(readStorage(HINT_STORAGE_PREFIX + id) !== "dismissed")
    const onReset = () => setVisible(true)
    window.addEventListener(GUIDE_RESET_EVENT, onReset)
    return () => window.removeEventListener(GUIDE_RESET_EVENT, onReset)
  }, [id])
  const dismiss = useCallback(() => {
    writeStorage(HINT_STORAGE_PREFIX + id, "dismissed")
    setVisible(false)
    trackStudioEvent("hint_dismissed", { hint: id })
  }, [id])
  return { visible, dismiss }
}

function DismissButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label="Dismiss tip" className="shrink-0 text-muted-foreground hover:text-foreground">
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

/** Spec F step 0. v2 only, first visit, one tap or skip. */
export function TradeQuestion() {
  const v2 = useStudioV2()
  const router = useRouter()
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onReset = () => setShow(true)
    setShow(!isTradeAnswered(readStorage(TRADE_STORAGE_KEY)))
    window.addEventListener(GUIDE_RESET_EVENT, onReset)
    return () => window.removeEventListener(GUIDE_RESET_EVENT, onReset)
  }, [])

  if (!v2.enabled || !show) return null

  const choose = (id: (typeof TRADES)[number]["id"]) => {
    const trade = TRADES.find((t) => t.id === id)!
    writeStorage(TRADE_STORAGE_KEY, id)
    setShow(false)
    trackStudioEvent("trade_selected", { trade: id, studio: v2.studio ?? undefined })
    if (v2.studio && trade.studio !== v2.studio) {
      router.replace(`/studio/${trade.studio}${window.location.search}`)
    }
  }

  return (
    <section aria-labelledby="trade-q" className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <h2 id="trade-q" className="text-sm font-semibold">
          What do you build?
        </h2>
        <button
          type="button"
          onClick={() => {
            writeStorage(TRADE_STORAGE_KEY, "skipped")
            setShow(false)
            trackStudioEvent("trade_skipped", { studio: v2.studio ?? undefined })
          }}
          className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Skip
        </button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">We&apos;ll open the right Studio for your work. You can switch any time.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {TRADES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => choose(t.id)}
            className="min-h-[44px] rounded-md border border-border bg-background px-3 py-2 text-left text-sm font-medium hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.label}
          </button>
        ))}
      </div>
    </section>
  )
}

/** Spec F step 1: three photo tips while the upload is empty. */
export function PhotoCoach({ studio }: { studio: string | null }) {
  const { visible, dismiss } = useHint("photo-coach")
  if (!visible) return null
  const subject = studio === "interior" ? "the whole room" : "the house or a fixed landmark"
  return (
    <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
      <div className="flex items-start justify-between gap-2">
        <p className="flex items-center gap-1.5 font-medium text-foreground">
          <Camera className="h-3.5 w-3.5" aria-hidden="true" />
          Photo tips
        </p>
        <DismissButton onClick={dismiss} />
      </div>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>{studio === "interior" ? "Stand in a corner or doorway, at eye level." : "Stand where the homeowner would stand, at eye level."}</li>
        <li>Include {subject} so the scale reads right.</li>
        <li>Use even daylight. Avoid harsh noon shadows and night shots.</li>
      </ul>
      <Link href={PHOTO_GUIDE_HREF} className="mt-2 inline-block font-medium text-foreground underline underline-offset-2">
        Read the 5-minute photo guide
      </Link>
    </div>
  )
}

/** Spec F step 2: soft warnings once a photo is in. Never blocks. */
export function PhotoCheck({ photoUrl, studio }: { photoUrl: string | null | undefined; studio: string | null }) {
  const [warnings, setWarnings] = useState<PhotoWarning[]>([])

  useEffect(() => {
    setWarnings([])
    if (!photoUrl) return
    let cancelled = false
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      if (cancelled) return
      let brightness = 255
      try {
        const canvas = document.createElement("canvas")
        const scale = Math.min(1, 64 / Math.max(img.naturalWidth, img.naturalHeight))
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          brightness = meanBrightness(ctx.getImageData(0, 0, canvas.width, canvas.height).data)
        }
      } catch {
        /* cross-origin image without CORS: skip the brightness check */
      }
      const found = photoWarnings(
        { width: img.naturalWidth, height: img.naturalHeight, brightness },
        studio === "interior" || studio === "exterior" || studio === "landscape" ? studio : null
      )
      setWarnings(found)
      for (const w of found) trackStudioEvent("photo_check_warning", { warning: w, studio: studio ?? undefined })
    }
    img.src = photoUrl
    return () => {
      cancelled = true
    }
  }, [photoUrl, studio])

  if (!warnings.length) return null
  return (
    <div role="status" className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
      <ul className="space-y-1">
        {warnings.map((w) => (
          <li key={w} className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" aria-hidden="true" />
            <span>{PHOTO_WARNING_TEXT[w]}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-muted-foreground">You can still render with this photo.</p>
    </div>
  )
}

/** Spec F step 5, as a one-line prompt under the first result. */
export function ReadResultHint({ hasRender }: { hasRender: boolean }) {
  const v2 = useStudioV2()
  const { visible, dismiss } = useHint("read-result")
  if (!v2.enabled || !hasRender || !visible) return null
  const items = v2.studio === "interior" ? "the walls, windows and doors" : "the house, fence and trees"
  return (
    <div className="flex items-start justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <p className="flex gap-2">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
        Check {items} against your photo before you show it to a client.
      </p>
      <DismissButton onClick={dismiss} />
    </div>
  )
}

/** Brings back every tip and the trade question. */
export function GuideButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        for (const id of HINT_IDS) writeStorage(HINT_STORAGE_PREFIX + id, null)
        writeStorage(TRADE_STORAGE_KEY, null)
        window.dispatchEvent(new Event(GUIDE_RESET_EVENT))
        trackStudioEvent("guide_opened")
      }}
      className={cn("inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground", className)}
    >
      <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
      Show tips
    </button>
  )
}

/** Demo counter with the carry-over line (true now that /api/demo/claim exists). */
export function DemoRendersLeft({ remaining }: { remaining: number }) {
  const { main, carry } = demoRendersLeftText(remaining)
  return (
    <div className="pt-4 text-sm text-muted-foreground">
      <p>{main}</p>
      {carry && <p className="mt-1 text-xs">{carry}</p>}
    </div>
  )
}

/** v2: one line under the Render button with cost and balance. */
export function RenderCostLine(props: { demoMode: boolean; demoRemaining: number; credits: number | null; cost: number }) {
  const v2 = useStudioV2()
  if (!v2.enabled) return null
  return (
    <p className="mt-2 text-center text-xs text-muted-foreground">
      {renderCostText({ demo: props.demoMode, demoRemaining: props.demoRemaining, credits: props.credits, cost: props.cost })}
    </p>
  )
}
