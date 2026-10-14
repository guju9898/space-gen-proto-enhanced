import type { Metadata } from "next"

/**
 * Force dynamic rendering for /auth/login so useSearchParams() can run
 * without requiring a Suspense boundary (Next.js 14+ prerender requirement).
 */
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false, follow: false },
}

export default function AuthLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
