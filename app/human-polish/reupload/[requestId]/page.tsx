import { ReplacementUploadForm } from "@/components/human-polish/reupload/ReplacementUploadForm"
import { isUuid, shortRequestId } from "@/lib/human-polish/admin-utils"
import { validateReplacementUploadPageAccess } from "@/lib/human-polish/replacement-auth"
import { getHumanPolishSupabaseService } from "@/lib/human-polish/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function HumanPolishReuploadPage({
  params,
  searchParams,
}: {
  params: Promise<{ requestId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { requestId } = await params
  const { token } = await searchParams

  const invalid = (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Upload link unavailable</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        This upload link is invalid or has expired. If you still need to send files, contact
        the Renderspace team with your request reference.
      </p>
    </main>
  )

  if (!isUuid(requestId) || typeof token !== "string" || !token.trim()) {
    return invalid
  }

  const supabase = getHumanPolishSupabaseService()
  if (!supabase) {
    return invalid
  }

  const access = await validateReplacementUploadPageAccess(supabase, requestId, token.trim())
  if (!access.ok) {
    return invalid
  }

  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Upload replacement files</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Request reference{" "}
          <span className="font-mono text-foreground">{shortRequestId(access.requestId)}</span>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Use this secure page only to add the files requested by the team. You cannot change
          your package, payment, or original intake answers here.
        </p>
      </div>
      <ReplacementUploadForm
        requestId={access.requestId}
        replacementToken={token.trim()}
        expiresAt={access.expiresAt}
      />
    </main>
  )
}
