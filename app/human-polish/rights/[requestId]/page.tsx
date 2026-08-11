/**
 * /human-polish/rights/[requestId]?token=...
 *
 * Portfolio permission Allow/Decline. Token-gated; no project/customer leakage.
 */

import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"
import { validateRightsPermissionPageAccess } from "@/lib/human-polish/rights-auth"
import { shortRequestId } from "@/lib/human-polish/admin-utils"
import { RightsPermissionForm } from "@/components/human-polish/rights/RightsPermissionForm"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function HumanPolishRightsPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { requestId } = await params
  const { token } = await searchParams
  const supabase = getHumanPolishSupabaseService()

  let valid = false
  if (supabase && typeof token === "string" && token.trim()) {
    const access = await validateRightsPermissionPageAccess(
      supabase,
      requestId,
      token.trim()
    )
    valid = access.ok
  }

  return (
    <main className="min-h-screen bg-[#0a0d14] px-4 py-16 text-white">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Human Polish™ Portfolio Permission
        </h1>

        {valid ? (
          <>
            <p className="text-sm text-muted-foreground">
              Request reference:{" "}
              <span className="font-mono text-white">{shortRequestId(requestId)}</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Renderspace is asking for permission to display selected visualization work from
              this project in its portfolio and marketing materials.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This permission does not include your name, company, street address, or an
              attributed testimonial unless you authorize those separately.
            </p>
            <RightsPermissionForm requestId={requestId} token={token!.trim()} />
          </>
        ) : (
          <div className="space-y-3 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-5">
            <p className="font-medium">Permission link unavailable</p>
            <p className="text-sm text-muted-foreground">
              This permission link is invalid or has expired. If you still need to respond,
              contact the Renderspace team with your request reference.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
