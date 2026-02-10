import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import { AuthProvider } from "@/components/auth/AuthContext"
import { LoginModalWrapper } from "@/components/auth/LoginModalWrapper"
import { CheckoutResume } from "@/components/auth/CheckoutResume"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Renderspace – Visualize in Seconds. Win More Projects",
  description: "Create client-ready interior, exterior, and landscape concepts in minutes — before plans, permits, or materials. Renderspace helps contractors, designers, and landscapers visualize concepts in seconds and win more projects.",
  openGraph: {
    title: "Renderspace – Visualize in Seconds. Win More Projects",
    description: "Create client-ready interior, exterior, and landscape concepts in minutes — before plans, permits, or materials.",
    siteName: "Renderspace",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Renderspace – Visualize in Seconds. Win More Projects",
    description: "Create client-ready interior, exterior, and landscape concepts in minutes — before plans, permits, or materials.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <DesignConfigProvider>
              {children}
              <LoginModalWrapper />
              <CheckoutResume />
            </DesignConfigProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
