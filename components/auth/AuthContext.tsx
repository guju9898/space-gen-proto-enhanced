"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

interface AuthContextType {
  user: User | null
  isLoginModalOpen: boolean
  /** Optional path to redirect to after magic link / OAuth (e.g. /studio/interior) */
  redirectAfterLogin: string | null
  openLoginModal: (next?: string) => void
  closeLoginModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const openLoginModal = useCallback((next?: string) => {
    setRedirectAfterLogin(next ?? null)
    setIsLoginModalOpen(true)
  }, [])

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false)
    setRedirectAfterLogin(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoginModalOpen,
        redirectAfterLogin,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}



