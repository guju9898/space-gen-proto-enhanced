"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const COOKIE_NAME = "renderspace_demo_id"
const DEMO_LIMIT = 5

function getCookieId(): string {
  if (typeof document === "undefined") return ""
  const match = document.cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  if (match) return decodeURIComponent(match[1].trim())
  const id = crypto.randomUUID?.() ?? `demo-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(id)}; path=/; max-age=31536000; samesite=lax`
  return id
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function DemoRenderGenerator() {
  const [email, setEmail] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState("Modern interior design, photorealistic, professional photography")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [rendersRemaining, setRendersRemaining] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  useEffect(() => {
    getCookieId()
  }, [])

  const fetchRemaining = useCallback(async (emailValue: string) => {
    try {
      const res = await fetch(`/api/demo-render?email=${encodeURIComponent(emailValue)}`)
      if (!res.ok) return
      const data = (await res.json()) as { rendersRemaining?: number }
      setRendersRemaining(data.rendersRemaining ?? DEMO_LIMIT)
    } catch {
      setRendersRemaining(DEMO_LIMIT)
    }
  }, [])

  useEffect(() => {
    if (email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fetchRemaining(email)
    } else {
      setRendersRemaining(null)
    }
  }, [email, fetchRemaining])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError("Only JPG and PNG images are supported")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be less than 10MB")
      return
    }
    setError(null)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleGenerate = async () => {
    const emailTrimmed = email.trim()
    if (!emailTrimmed) {
      setError("Please enter your email")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setError("Please enter a valid email")
      return
    }
    if (!imageFile) {
      setError("Please upload an image")
      return
    }

    setLoading(true)
    setError(null)
    setLimitReached(false)

    try {
      const imageDataUrl = await fileToDataUrl(imageFile)
      const res = await fetch("/api/demo-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailTrimmed,
          image: imageDataUrl,
          prompt: prompt.trim() || "Modern interior design, photorealistic",
        }),
      })

      const data = (await res.json()) as { imageUrl?: string; rendersRemaining?: number; error?: string }

      if (!res.ok) {
        if (res.status === 429 || data.error === "Demo limit reached") {
          setLimitReached(true)
          setRendersRemaining(0)
        }
        setError(data.error ?? "Failed to generate render")
        return
      }

      setGeneratedImage(data.imageUrl ?? null)
      setRendersRemaining(data.rendersRemaining ?? 0)
    } catch {
      setError("Failed to generate render")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-4">
        Try the live render generator
      </h2>
      <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
        Generate up to 5 AI renders — no account required. Enter your email to get started.
      </p>

      <div className="max-w-xl mx-auto space-y-6">
        <Card className="bg-[#191f33]/50 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Generate a concept render</CardTitle>
            <CardDescription>
              Upload a photo and we&apos;ll generate a design concept in seconds.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="demo-email" className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <Input
                id="demo-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background border-white/10 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Reference image
              </label>
              <Input
                type="file"
                accept="image/jpeg,image/png"
                onChange={onFileChange}
                className="bg-background border-white/10 text-white file:text-foreground"
              />
              {imagePreview && (
                <div className="relative mt-2 aspect-video rounded-lg overflow-hidden border border-white/10">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>
            <div>
              <label htmlFor="demo-prompt" className="block text-sm font-medium text-white mb-2">
                Prompt (optional)
              </label>
              <Input
                id="demo-prompt"
                type="text"
                placeholder="e.g. Modern interior design, photorealistic"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-background border-white/10 text-white"
              />
            </div>
            {rendersRemaining !== null && (
              <p className="text-sm text-muted-foreground">
                You have {rendersRemaining} demo render{rendersRemaining !== 1 ? "s" : ""} remaining.
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {limitReached && (
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-sm text-white">
                  You&apos;ve reached the demo limit. Create a free account to continue generating renders.
                </p>
                <Button asChild className="bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white">
                  <Link href="/onboarding">Start Intro Plan</Link>
                </Button>
              </div>
            )}
            {!limitReached && (
              <Button
                onClick={handleGenerate}
                disabled={loading || rendersRemaining === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 text-white"
              >
                {loading ? "Generating…" : "Generate render"}
              </Button>
            )}
          </CardContent>
        </Card>

        {generatedImage && (
          <Card className="bg-[#191f33]/50 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Your generated concept</CardTitle>
              <CardDescription>Concept generated in seconds.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                <Image
                  src={generatedImage}
                  alt="Generated concept"
                  fill
                  className="object-contain"
                  unoptimized={generatedImage.startsWith("http")}
                />
              </div>
              {rendersRemaining !== null && (
                <p className="text-sm text-muted-foreground mt-4">
                  You have {rendersRemaining} demo render{rendersRemaining !== 1 ? "s" : ""} remaining.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  )
}
