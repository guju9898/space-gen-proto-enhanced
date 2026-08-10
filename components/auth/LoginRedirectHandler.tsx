"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { trySafeLocalReturnPath } from "@/lib/auth/safe-return-path"
import { useAuth } from "./AuthContext"

/**
 * When the URL has ?login=1 (e.g. after redirect from Admin or /auth/login),
 * open the login modal. A validated `next` query param becomes redirectAfterLogin
 * so magic-link / OAuth completion can return to that local path.
 */
export function LoginRedirectHandler() {
  const searchParams = useSearchParams()
  const { openLoginModal } = useAuth()

  useEffect(() => {
    if (searchParams?.get("login") !== "1") return
    const safeNext = trySafeLocalReturnPath(searchParams.get("next"))
    openLoginModal(safeNext ?? undefined)
  }, [searchParams, openLoginModal])

  return null
}
