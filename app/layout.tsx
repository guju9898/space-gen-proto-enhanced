import type React from "react"
import { Suspense } from "react"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import { AuthProvider } from "@/components/auth/AuthContext"
import { AuthProvider as SessionAuthProvider } from "@/components/auth/AuthProvider"
import { LoginModalWrapper } from "@/components/auth/LoginModalWrapper"
import { CheckoutResume } from "@/components/auth/CheckoutResume"
import { IntroModal } from "@/components/marketing/IntroModal"
import { IntroPlanPromo } from "@/components/marketing/IntroPlanPromo"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import Script from "next/script"

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
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-95W8Z5DE2P"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-95W8Z5DE2P');
          `}
        </Script>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <SessionAuthProvider>
            <AuthProvider>
              <DesignConfigProvider>
                {children}
                <Suspense fallback={null}>
                  <LoginModalWrapper />
                </Suspense>
                <CheckoutResume />
                <Suspense fallback={null}>
                  <IntroModal />
                </Suspense>
                <Suspense fallback={null}>
                  <IntroPlanPromo />
                </Suspense>
              </DesignConfigProvider>
            </AuthProvider>
          </SessionAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
