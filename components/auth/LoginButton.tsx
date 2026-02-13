"use client"

import { useAuth } from "./AuthContext"

export function LoginButton() {
  const { openLoginModal } = useAuth()

  return (
    <button
      onClick={openLoginModal}
      className="text-sm text-white hover:text-primary/90 transition-colors"
    >
      Login
    </button>
  )
}



