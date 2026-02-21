"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * Login is handled by the LoginModal on the home page.
 * This route redirects /auth/login -> / so users can use the in-app login.
 * Preserves error params (e.g. ?error=auth_callback_failed) so the modal can show guidance.
 */
export default function AuthLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams?.get("error")
    const message = searchParams?.get("message")
    const params = new URLSearchParams({ login: "1" })
    if (error) params.set("error", error)
    if (message) params.set("message", message)
    router.replace(`/?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login…</p>
    </div>
  )
}
