import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import { Inter } from "next/font/google"
import type { Metadata } from "next"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Space Gen",
  description: "AI-powered interior design studio",
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
          <DesignConfigProvider>
            {children}
          </DesignConfigProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'