"use client"

import { FormEvent, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ChevronRight } from "lucide-react"

const REVENUE_OPTIONS = [
  { value: "", label: "Select range (optional)" },
  { value: "under-25k", label: "Under $25k / month" },
  { value: "25k-75k", label: "$25k – $75k / month" },
  { value: "75k-150k", label: "$75k – $150k / month" },
  { value: "150k-plus", label: "$150k+ / month" },
  { value: "prefer-not", label: "Prefer not to say" },
]

const STORAGE_KEY = "renderspace_book_demo_submitted"

const inputClasses =
  "w-full rounded-md bg-[#101010] border border-[#343434] px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary"

export function BookDemoContent() {
  const searchParams = useSearchParams()
  const bookingUrl = process.env.NEXT_PUBLIC_PREMIUM_BOOKING_URL ?? ""

  const [phase, setPhase] = useState<"form" | "success">("form")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [monthlyRevenue, setMonthlyRevenue] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") {
        setPhase("success")
      }
    } catch {
      /* private mode */
    }
  }, [])

  const schedulingUnlocked = phase === "success"

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus("submitting")
    setErrorMessage("")

    const sourceParam = searchParams?.get("source")?.trim()
    const cityParam = searchParams?.get("city")?.trim()

    try {
      const res = await fetch("/api/book-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          company,
          monthlyRevenue,
          ...(sourceParam ? { source: sourceParam } : {}),
          ...(cityParam ? { citySlug: cityParam } : {}),
        }),
      })
      const data = (await res.json().catch(() => ({}))) as { error?: string }
      if (!res.ok) {
        setStatus("error")
        setErrorMessage(data.error ?? "Something went wrong. Please try again.")
        return
      }
      try {
        sessionStorage.setItem(STORAGE_KEY, "1")
      } catch {
        /* ignore */
      }
      setPhase("success")
      setStatus("idle")
    } catch {
      setStatus("error")
      setErrorMessage("Network error. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/amethyst-flow.png" alt="Renderspace" width={32} height={32} className="w-8 h-8" />
            <span className="font-bold text-lg text-white">Renderspace</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/contractor-demo" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Contractor demo
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Pricing
            </Link>
            <Link href="/human-polish" className="text-sm text-muted-foreground hover:text-white transition-colors">
              Human Polish™
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
            Book Your 30-Minute Renderspace Demo
          </h1>
          <p className="text-muted-foreground text-lg mt-4 leading-relaxed">
            Tell us a little about your business, then book a time to see how Renderspace can help you close more outdoor
            living and landscaping jobs.
          </p>
        </div>

        <div className="max-w-xl mx-auto rounded-xl border border-[#343434] bg-[#191f33]/80 p-6 md:p-8 shadow-lg">
          {phase === "success" ? (
            <div className="text-center py-4">
              <p className="text-white font-semibold text-lg mb-2">
                Thanks — your details are in. Now choose a time for your 30-minute demo.
              </p>
              <p className="text-muted-foreground text-sm">
                Use the scheduling section below when you&apos;re ready.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="bd-fullName" className="block text-sm font-medium text-white mb-1.5">
                  Full name <span className="text-orange-400">*</span>
                </label>
                <input
                  id="bd-fullName"
                  name="fullName"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="bd-email" className="block text-sm font-medium text-white mb-1.5">
                  Email <span className="text-orange-400">*</span>
                </label>
                <input
                  id="bd-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="bd-phone" className="block text-sm font-medium text-white mb-1.5">
                  Phone number <span className="text-orange-400">*</span>
                </label>
                <input
                  id="bd-phone"
                  name="phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="bd-company" className="block text-sm font-medium text-white mb-1.5">
                  Company name
                </label>
                <input
                  id="bd-company"
                  name="company"
                  autoComplete="organization"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="bd-revenue" className="block text-sm font-medium text-white mb-1.5">
                  Monthly revenue
                </label>
                <select
                  id="bd-revenue"
                  name="monthlyRevenue"
                  value={monthlyRevenue}
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  className={inputClasses}
                >
                  {REVENUE_OPTIONS.map((o) => (
                    <option key={o.value || "empty"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              {errorMessage ? <p className="text-sm text-red-400">{errorMessage}</p> : null}
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 disabled:opacity-50 disabled:pointer-events-none transition-all text-white px-6 py-3 rounded-md font-medium"
              >
                {status === "submitting" ? "Sending…" : "Submit details"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div
          className={`max-w-xl mx-auto mt-12 rounded-xl border p-6 md:p-8 text-center transition-opacity duration-300 ${
            schedulingUnlocked
              ? "border-white/15 bg-[#0c0f18]/90 opacity-100"
              : "border-white/5 bg-[#0a0c12]/80 opacity-50 pointer-events-none select-none"
          }`}
        >
          <h2 className="text-lg font-semibold text-white mb-2">Schedule your demo (Google Meet)</h2>
          {!schedulingUnlocked ? (
            <p className="text-sm text-muted-foreground">Complete the form above to unlock scheduling.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Pick a 30-minute slot that works for you. You&apos;ll join on Google Meet.
              </p>
              {bookingUrl ? (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-violet-700 hover:opacity-90 transition-all text-white px-6 py-3 rounded-md font-medium"
                >
                  Book My 30-Minute Demo
                  <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="rounded-lg border border-dashed border-orange-500/25 bg-black/25 px-4 py-5">
                  <p className="text-sm text-muted-foreground">
                    Online scheduling isn&apos;t linked yet. Our team will follow up by email with a few time options, or
                    set <code className="text-orange-200/90 text-xs">NEXT_PUBLIC_PREMIUM_BOOKING_URL</code> to enable the
                    booking button here.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
