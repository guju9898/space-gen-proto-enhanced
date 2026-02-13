"use client"

import { LoginModal } from "./LoginModal"
import { useAuth } from "./AuthContext"

export function LoginModalWrapper() {
  const { isLoginModalOpen, closeLoginModal } = useAuth()
  return <LoginModal open={isLoginModalOpen} onOpenChange={closeLoginModal} />
}



