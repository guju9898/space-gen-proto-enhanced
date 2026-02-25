"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/components/auth/AuthProvider"

export function RedirectIfAuthenticated() {
  const { session, loading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!loading && session) {
      router.replace("/studio/interior")
    }
  }, [session, loading, router])

  return null
}
