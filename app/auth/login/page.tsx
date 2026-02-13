"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Login is handled by the LoginModal on the home page.
 * This route redirects /auth/login -> / so users can use the in-app login.
 */
export default function AuthLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/?login=1")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting to login…</p>
    </div>
  )
}
