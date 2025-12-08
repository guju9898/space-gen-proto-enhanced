import type React from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import AuthCookieSync from "@/components/AuthCookieSync"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Space Gen AI Design Studio",
    template: "%s | Space Gen",
  },
  description: "AI-powered interior, exterior, and landscape design — generate photo-realistic concepts with zero friction.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_DOMAIN || "https://spacegen.ai"),
  openGraph: {
    title: "Space Gen AI Design Studio",
    description: "AI-generated renderings for interiors, exteriors, and landscapes.",
    url: process.env.NEXT_PUBLIC_DOMAIN || "https://spacegen.ai",
    siteName: "Space Gen",
    images: [
      {
        url: "/og-cover.png",
        width: 1200,
        height: 630,
        alt: "Space Gen Open Graph Image",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Space Gen",
    description: "AI design generator for interiors, exteriors, and landscapes.",
    images: ["/og-cover.png"],
  },
  icons: {
    icon: "/favicon.ico",
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
        <AuthCookieSync />
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <DesignConfigProvider>
            {children}
          </DesignConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}