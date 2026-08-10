import { BuildReadyPayForm } from "@/components/human-polish/pay/BuildReadyPayForm"
import { getDeliveryTarget } from "@/lib/human-polish/config"
import { validateBuildReadyPaymentPageAccess } from "@/lib/human-polish/payment-auth"
import { shortRequestId } from "@/lib/human-polish/admin-utils"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  isHumanPolishPackage,
} from "@/lib/human-polish/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function HumanPolishBuildReadyPayPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { requestId } = await params
  const { token } = await searchParams

  const unavailable = (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Payment link unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This payment link is invalid or has expired. If you still need to pay, contact the
        Renderspace team with your request reference.
      </p>
    </main>
  )

  if (typeof token !== "string" || !token.trim()) {
    return unavailable
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) return unavailable

  const access = await validateBuildReadyPaymentPageAccess(
    supabase,
    requestId,
    token.trim()
  )
  if (!access.ok) return unavailable

  const row = access.request
  const pkg = row.approved_package
  if (!isHumanPolishPackage(pkg) || typeof row.approved_amount !== "number") {
    return unavailable
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Human Polish™ Build-Ready
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Complete your payment</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Request reference{" "}
          <span className="font-mono text-foreground">{shortRequestId(row.id)}</span>
        </p>
      </div>
      <BuildReadyPayForm
        requestId={row.id}
        paymentToken={token.trim()}
        packageLabel={HUMAN_POLISH_PACKAGE_LABELS[pkg]}
        amountCents={row.approved_amount}
        currency={row.currency || "usd"}
        deliveryTarget={getDeliveryTarget("build-ready", pkg)}
      />
    </main>
  )
}
