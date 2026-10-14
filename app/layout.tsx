import type { Metadata } from "next"
import { ThemeProvider } from "@/components/theme-provider"
import { DesignConfigProvider } from "@/hooks/useDesignConfig"
import { AuthProvider } from "@/components/auth/AuthContext"
import { AuthProvider as SessionAuthProvider } from "@/components/auth/AuthProvider"
import { LoginModalWrapper } from "@/components/auth/LoginModalWrapper"
import { CheckoutResume } from "@/components/auth/CheckoutResume"
import { IntroModal } from "@/components/marketing/IntroModal"
import { IntroPlanPromo } from "@/components/marketing/IntroPlanPromo"
import { Inter } from "next/font/google"
import type React from "react"
import { Suspense } from "react"
import "./globals.css"
import Script from "next/script"
import { getBlogSiteOrigin } from "@/lib/blog/site"
import { JsonLd } from "@/components/seo/JsonLd"
import { siteGraphLd } from "@/lib/seo/schema"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(getBlogSiteOrigin()),
  // Child pages set `title: "Page name"` and get " | Renderspace" appended.
  // Pages whose title already contains the brand must use `title: { absolute: ... }`.
  title: {
    default: "Renderspace: AI Renderings From a Job-Site Photo",
    template: "%s | Renderspace",
  },
  description: "Turn a job-site photo into a photorealistic backyard, patio, exterior or interior concept in about 30 seconds and show clients the result before you quote.",
  openGraph: {
    title: "Renderspace: AI Renderings From a Job-Site Photo",
    description: "Turn a job-site photo into a photorealistic backyard, patio, exterior or interior concept in about 30 seconds and show clients the result before you quote.",
    siteName: "Renderspace",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Renderspace: AI Renderings From a Job-Site Photo",
    description: "Turn a job-site photo into a photorealistic backyard, patio, exterior or interior concept in about 30 seconds and show clients the result before you quote.",
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
        <JsonLd data={siteGraphLd()} />
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
