"use client"

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export type AuthStatus = "initializing" | "unauthenticated" | "authenticated"

interface AuthContextType {
  user: User | null
  /** Resolves after first getSession(); use to block render attempts until auth is known */
  status: AuthStatus
  isLoginModalOpen: boolean
  /** Optional path to redirect to after magic link / OAuth (e.g. /studio/interior) */
  redirectAfterLogin: string | null
  openLoginModal: (next?: string) => void
  closeLoginModal: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initialized, setInitialized] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [redirectAfterLogin, setRedirectAfterLogin] = useState<string | null>(null)

  const status: AuthStatus = !initialized
    ? "initializing"
    : user
      ? "authenticated"
      : "unauthenticated"

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setInitialized(true)
    })
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
        status,
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



