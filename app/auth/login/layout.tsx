/**
 * Force dynamic rendering for /auth/login so useSearchParams() can run
 * without requiring a Suspense boundary (Next.js 14+ prerender requirement).
 */
export const dynamic = "force-dynamic"

export default function AuthLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
