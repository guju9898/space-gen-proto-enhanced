import { redirect } from "next/navigation"
import { affiliatesEnabled } from "@/lib/affiliates/config"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import {
  approveAffiliateAction,
  payoutAction,
  programStatusAction,
  rejectAffiliateAction,
  releaseHeldCommissionsAction,
  reverseCommissionAction,
} from "@/app/admin/affiliates/actions"

export const dynamic = "force-dynamic"

function money(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}

export default async function AffiliateAdminPage() {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok && auth.code === "unauthenticated") {
    redirect("/?login=1&next=/admin/affiliates")
  }
  if (!auth.ok) return null

  const { data: config } = await auth.supabase
    .from("affiliate_program_config")
    .select("status, max_commission_bps, hold_days, attribution_window_days, customer_discount_percent")
    .eq("id", "default")
    .maybeSingle()
  const { data: accounts } = await auth.supabase
    .from("affiliate_accounts")
    .select("id, status, display_name, partner_type, code, commission_bps, created_at")
    .order("created_at", { ascending: false })
    .limit(50)
  const { data: attributions } = await auth.supabase
    .from("affiliate_attributions")
    .select("id, code, referred_user_id, attributed_at, commission_ends_at")
    .order("attributed_at", { ascending: false })
    .limit(30)
  const { data: commissions } = await auth.supabase
    .from("affiliate_commissions")
    .select("id, kind, status, amount_cents, basis_cents, stripe_invoice_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(30)
  const { data: payouts } = await auth.supabase
    .from("affiliate_payouts")
    .select("id, amount_cents, status, external_reference, requested_at")
    .order("requested_at", { ascending: false })
    .limit(30)

  const tablesReady = Boolean(config)

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="rounded-lg border border-white/10 p-5">
        <h2 className="text-lg font-semibold">Program</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Runtime switch AFFILIATES_ENABLED is {affiliatesEnabled() ? "on" : "off"}. Database status is{" "}
          {config?.status ?? "unavailable"}. Commissions run only when both the switch is on and the status is active.
          Customer referral discount is {config?.customer_discount_percent ?? 0}% and is not applied without an existing
          Stripe coupon in AFFILIATE_CUSTOMER_COUPON.
        </p>
        {tablesReady ? (
          <form action={programStatusAction} className="mt-4 flex flex-wrap items-center gap-3">
            <select name="status" defaultValue={config?.status ?? "draft"} className="h-10 rounded-md border border-white/15 bg-[#0d1119] px-3">
              <option value="draft">draft</option>
              <option value="active">active</option>
              <option value="paused">paused</option>
            </select>
            <button className="h-10 rounded-md border border-white/30 px-4 text-sm" type="submit">
              Save status
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">Apply the affiliate migration before using this screen.</p>
        )}
        <form action={releaseHeldCommissionsAction} className="mt-4">
          <button className="h-10 rounded-md border border-white/30 px-4 text-sm" type="submit">
            Approve commissions whose hold has ended
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Applications</h2>
        <ul className="mt-4 space-y-3">
          {(accounts ?? []).map((account) => (
            <li key={account.id} className="rounded-lg border border-white/10 p-4">
              <p className="text-white">
                {account.display_name} · {account.partner_type} · {account.status}
                {account.code ? ` · ${account.code}` : ""}
                {account.commission_bps !== null ? ` · ${account.commission_bps / 100}%` : ""}
              </p>
              {account.status !== "approved" ? (
                <form action={approveAffiliateAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="accountId" value={account.id} />
                  <label className="text-sm text-muted-foreground">
                    Rate %
                    <input
                      name="commissionPercent"
                      type="number"
                      min={0}
                      max={25}
                      step="0.01"
                      required
                      className="ml-2 h-10 w-24 rounded-md border border-white/15 bg-transparent px-2"
                    />
                  </label>
                  <button className="h-10 rounded-md bg-gradient-to-r from-orange-500 to-violet-700 px-4 text-sm" type="submit">
                    Approve
                  </button>
                </form>
              ) : null}
              {account.status === "approved" || account.status === "pending" ? (
                <form action={rejectAffiliateAction} className="mt-2">
                  <input type="hidden" name="accountId" value={account.id} />
                  <input type="hidden" name="status" value={account.status === "approved" ? "suspended" : "rejected"} />
                  <button className="h-10 rounded-md border border-white/30 px-4 text-sm" type="submit">
                    {account.status === "approved" ? "Suspend" : "Reject"}
                  </button>
                </form>
              ) : null}
            </li>
          ))}
          {(accounts ?? []).length === 0 ? <li className="text-sm text-muted-foreground">No applications.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Referred subscriptions</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {(attributions ?? []).map((row) => (
            <li key={row.id}>
              {row.code} · customer {String(row.referred_user_id).slice(0, 8)} · {row.attributed_at}
              {row.commission_ends_at ? ` · earns through ${row.commission_ends_at}` : ""}
            </li>
          ))}
          {(attributions ?? []).length === 0 ? <li>No referred customers.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Commission ledger</h2>
        <ul className="mt-4 space-y-3">
          {(commissions ?? []).map((row) => (
            <li key={row.id} className="rounded-lg border border-white/10 p-4 text-sm">
              <p>
                {row.kind} · {row.status} · {money(row.amount_cents)}
                {row.stripe_invoice_id ? ` · invoice ${row.stripe_invoice_id}` : ""} · {row.reason}
              </p>
              {row.kind === "earn" && row.status !== "reversed" && row.status !== "void" ? (
                <form action={reverseCommissionAction} className="mt-2">
                  <input type="hidden" name="commissionId" value={row.id} />
                  <button className="h-10 rounded-md border border-white/30 px-4 text-sm" type="submit">
                    Reverse
                  </button>
                </form>
              ) : null}
            </li>
          ))}
          {(commissions ?? []).length === 0 ? <li className="text-sm text-muted-foreground">No commissions.</li> : null}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Payouts</h2>
        <ul className="mt-4 space-y-3">
          {(payouts ?? []).map((payout) => (
            <li key={payout.id} className="rounded-lg border border-white/10 p-4 text-sm">
              <p>
                {money(payout.amount_cents)} · {payout.status}
                {payout.external_reference ? ` · ${payout.external_reference}` : ""}
              </p>
              {payout.status === "requested" || payout.status === "approved" ? (
                <form action={payoutAction} className="mt-3 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="payoutId" value={payout.id} />
                  <input
                    name="reference"
                    placeholder="Payment reference"
                    className="h-10 rounded-md border border-white/15 bg-transparent px-3"
                  />
                  {payout.status === "requested" ? (
                    <button name="action" value="approve" className="h-10 rounded-md border border-white/30 px-4" type="submit">
                      Approve
                    </button>
                  ) : (
                    <button name="action" value="mark_paid" className="h-10 rounded-md border border-white/30 px-4" type="submit">
                      Mark paid
                    </button>
                  )}
                  <button name="action" value="reject" className="h-10 rounded-md border border-white/30 px-4" type="submit">
                    Reject
                  </button>
                </form>
              ) : null}
            </li>
          ))}
          {(payouts ?? []).length === 0 ? <li className="text-sm text-muted-foreground">No payouts.</li> : null}
        </ul>
      </section>
    </main>
  )
}
