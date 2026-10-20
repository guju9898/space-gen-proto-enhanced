import type { Metadata } from "next"
import Link from "next/link"
import { SiteFooter } from "@/components/site/SiteFooter"
import { SiteHeader } from "@/components/site/SiteHeader"
import { AffiliateApplyForm } from "@/components/conversion/group-6/AffiliateApplyForm"
import { AffiliateDashboardView } from "@/components/conversion/group-6/AffiliateDashboardView"
import { CopyReferralLink } from "@/components/conversion/group-6/CopyReferralLink"
import { RequestPayoutButton } from "@/components/conversion/group-6/RequestPayoutButton"
import { affiliatesEnabled, programIsLive } from "@/lib/affiliates/config"
import { getAffiliateService, loadProgram } from "@/lib/affiliates/service"
import { getBlogSiteOrigin } from "@/lib/blog/site"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Affiliates",
  robots: { index: false, follow: false },
}

export const dynamic = "force-dynamic"

type CommissionRow = {
  id: string
  kind: string
  status: string
  amount_cents: number
  reversal_of: string | null
  referred_user_id: string
}

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

export default async function AffiliatesPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const service = getAffiliateService()
  const program = service ? await loadProgram(service).catch(() => null) : null
  const live = programIsLive(program, affiliatesEnabled())

  let account: {
    id: string
    status: string
    display_name: string
    code: string | null
    commission_bps: number | null
  } | null = null
  let clicks = 0
  let signups = 0
  let paying = 0
  let pendingCents = 0
  let approvedCents = 0
  let paidCents = 0

  if (user) {
    const { data } = await supabase
      .from("affiliate_accounts")
      .select("id, status, display_name, code, commission_bps")
      .eq("user_id", user.id)
      .maybeSingle()
    account = data
    if (account?.id) {
      const clickCount = await supabase
        .from("affiliate_clicks")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", account.id)
      clicks = clickCount.count ?? 0
      const signupCount = await supabase
        .from("affiliate_attributions")
        .select("id", { count: "exact", head: true })
        .eq("affiliate_id", account.id)
      signups = signupCount.count ?? 0
      const { data: commissions } = await supabase
        .from("affiliate_commissions")
        .select("id, kind, status, amount_cents, reversal_of, referred_user_id")
        .eq("affiliate_id", account.id)
      const rows = (commissions ?? []) as CommissionRow[]
      const reversed = new Map<string, number>()
      for (const row of rows) {
        if (row.kind === "reversal" && row.reversal_of) {
          reversed.set(row.reversal_of, (reversed.get(row.reversal_of) ?? 0) + row.amount_cents)
        }
      }
      const payers = new Set<string>()
      for (const row of rows) {
        if (row.kind !== "earn") continue
        const net = row.amount_cents - (reversed.get(row.id) ?? 0)
        if (net <= 0) continue
        payers.add(row.referred_user_id)
        if (row.status === "pending") pendingCents += net
        if (row.status === "approved") approvedCents += net
        if (row.status === "paid") paidCents += net
      }
      paying = payers.size
    }
  }

  const link = account?.code ? `${getBlogSiteOrigin()}/?ref=${account.code}` : null
  const rate = account?.commission_bps === null || account?.commission_bps === undefined
    ? null
    : `${(account.commission_bps / 100).toFixed(2).replace(/\.00$/, "")}%`

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <AffiliateDashboardView />
      <main className="container mx-auto max-w-3xl px-4 py-16">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Partners</p>
        <h1 className="mt-2 text-4xl font-bold text-white">Affiliate program</h1>
        <p className="mt-4 text-muted-foreground">
          Approved partners can earn a commission on qualifying subscription payments from customers they refer.
          The maximum rate is 25% of collected subscription revenue for the customer&apos;s first 12 months.
          Taxes, refunds, chargebacks, and unpaid invoices are excluded. A referred customer is attributed to the
          first valid partner link they use, and that link expires after{" "}
          {program?.attributionWindowDays ?? 30} days.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          {live
            ? "The program is active. Commissions are calculated after Stripe confirms payment and stay pending through the holding period."
            : "These terms are proposed and are not an offer. Commissions are not being calculated until Renderspace approves the program."}
        </p>

        {!user ? (
          <p className="mt-8">
            <Link href="/?login=1" className="inline-flex h-10 items-center rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 text-sm font-medium text-white">
              Sign in to apply
            </Link>
          </p>
        ) : null}

        {user && !account ? (
          <section className="mt-10 rounded-lg border border-white/10 p-6">
            <h2 className="text-xl font-semibold text-white">Apply</h2>
            <p className="mt-2 mb-6 text-sm text-muted-foreground">
              Approval sets your commission rate. Applying does not guarantee the maximum rate.
            </p>
            <AffiliateApplyForm />
          </section>
        ) : null}

        {account ? (
          <section className="mt-10 space-y-6">
            <div className="rounded-lg border border-white/10 p-6">
              <h2 className="text-xl font-semibold text-white">{account.display_name}</h2>
              <p className="mt-1 text-sm capitalize text-muted-foreground">Status: {account.status}</p>
              {rate ? <p className="mt-1 text-sm text-muted-foreground">Approved commission rate: {rate}</p> : null}
              {link && account.status === "approved" ? (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code className="break-all text-sm text-white">{link}</code>
                  <CopyReferralLink link={link} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">A referral link is issued after approval.</p>
              )}
              {!live && account.status === "approved" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  This link does not earn a commission until the program is approved and turned on.
                </p>
              ) : null}
            </div>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Referral clicks", String(clicks)],
                ["Qualified signups", String(signups)],
                ["Paying referrals", String(paying)],
                ["Pending", money(pendingCents)],
                ["Approved", money(approvedCents)],
                ["Paid", money(paidCents)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-white/10 p-4">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-lg text-white">{value}</dd>
                </div>
              ))}
            </dl>
            {account.status === "approved" ? <RequestPayoutButton /> : null}
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  )
}
