import Link from "next/link"

/**
 * Custom 404 page. Ensures the not-found route prerenders without errors
 * (avoids relying on the internal /_not-found page that can fail with layout providers).
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground px-4">
      <h1 className="text-2xl font-semibold text-white mb-2">Page not found</h1>
      <p className="text-muted-foreground mb-6 text-center">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary rounded"
      >
        Back to home
      </Link>
    </div>
  )
}
