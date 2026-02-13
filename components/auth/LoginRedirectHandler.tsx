"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "./AuthContext"

/**
 * When the URL has ?login=1 (e.g. after redirect from /auth/login), open the login modal.
 */
export function LoginRedirectHandler() {
  const searchParams = useSearchParams()
  const { openLoginModal } = useAuth()

  useEffect(() => {
    if (searchParams?.get("login") === "1") {
      openLoginModal()
    }
  }, [searchParams, openLoginModal])

  return null
}
