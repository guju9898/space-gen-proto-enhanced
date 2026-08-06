import { AdminForbidden } from "@/components/human-polish/admin/AdminStates"
import { requireHumanPolishAdminPage } from "@/lib/human-polish/admin-page-auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function HumanPolishAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Soft gate for nested pages; each page/action still authorizes independently.
  // Detail pages pass their own return path in page-level auth.
  const auth = await requireHumanPolishAdminPage("/admin/human-polish")
  if ("forbidden" in auth) {
    return <AdminForbidden message={auth.error} />
  }

  return (
    <div className="min-h-screen bg-[#0a0d14] text-white">
      <header className="border-b border-[#343434] bg-[#0d1119]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Internal
            </p>
            <h1 className="text-lg font-semibold">Human Polish operations</h1>
          </div>
          <p className="text-xs text-muted-foreground">{auth.email}</p>
        </div>
      </header>
      {children}
    </div>
  )
}
