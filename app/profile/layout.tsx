import type { Metadata } from "next"
import type React from "react"

// Account/checkout flow: no search value. Keep out of search and AI indexes.
export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
