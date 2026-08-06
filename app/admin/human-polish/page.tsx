import { AdminErrorState } from "@/components/human-polish/admin/AdminStates"
import { AdminRequestFilters } from "@/components/human-polish/admin/AdminRequestFilters"
import { AdminRequestPagination } from "@/components/human-polish/admin/AdminRequestPagination"
import { AdminRequestTable } from "@/components/human-polish/admin/AdminRequestTable"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { listHumanPolishAdminRequests } from "@/lib/human-polish/admin-queries"
import { sanitizeSearchText } from "@/lib/human-polish/admin-utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function HumanPolishAdminListPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  // Independent auth (in addition to layout).
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdminErrorState message={auth.error} />
      </main>
    )
  }

  const params = await searchParams
  const filters = {
    q: sanitizeSearchText(first(params.q)),
    status: first(params.status),
    family: first(params.family),
    package: first(params.package),
    paymentStatus: first(params.paymentStatus),
    rush: first(params.rush),
    page: first(params.page),
  }

  const result = await listHumanPolishAdminRequests(auth.supabase, filters)

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Requests</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Operational queue for Human Polish intake and production.
        </p>
      </div>

      <AdminRequestFilters filters={filters} />

      {!result.ok ? (
        <AdminErrorState message={result.error} />
      ) : (
        <>
          <AdminRequestTable rows={result.rows} />
          <AdminRequestPagination
            page={result.page}
            pageSize={result.pageSize}
            total={result.total}
            filters={{
              q: filters.q || undefined,
              status: filters.status,
              family: filters.family,
              package: filters.package,
              paymentStatus: filters.paymentStatus,
              rush: filters.rush,
            }}
          />
        </>
      )}
    </main>
  )
}
