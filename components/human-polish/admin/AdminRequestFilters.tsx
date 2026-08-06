import Link from "next/link"
import {
  HUMAN_POLISH_PACKAGE_LABELS,
  HUMAN_POLISH_PACKAGES,
  HUMAN_POLISH_PAYMENT_STATUSES,
  HUMAN_POLISH_SERVICE_FAMILIES,
  HUMAN_POLISH_SERVICE_FAMILY_LABELS,
  HUMAN_POLISH_STATUSES,
  HUMAN_POLISH_STATUS_LABELS,
} from "@/lib/human-polish/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = {
  filters: {
    q?: string
    status?: string
    family?: string
    package?: string
    paymentStatus?: string
    rush?: string
  }
}

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

export function AdminRequestFilters({ filters }: Props) {
  return (
    <form
      method="get"
      className="grid gap-3 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      aria-label="Filter Human Polish requests"
    >
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="admin-q">Search</Label>
        <Input
          id="admin-q"
          name="q"
          defaultValue={filters.q || ""}
          placeholder="Request ID, name, company, or email"
          autoComplete="off"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-status">Status</Label>
        <select
          id="admin-status"
          name="status"
          defaultValue={filters.status || ""}
          className={selectClass}
        >
          <option value="">All statuses</option>
          {HUMAN_POLISH_STATUSES.map((s) => (
            <option key={s} value={s}>
              {HUMAN_POLISH_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-family">Service family</Label>
        <select
          id="admin-family"
          name="family"
          defaultValue={filters.family || ""}
          className={selectClass}
        >
          <option value="">All families</option>
          {HUMAN_POLISH_SERVICE_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {HUMAN_POLISH_SERVICE_FAMILY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-package">Package</Label>
        <select
          id="admin-package"
          name="package"
          defaultValue={filters.package || ""}
          className={selectClass}
        >
          <option value="">All packages</option>
          {HUMAN_POLISH_PACKAGES.map((p) => (
            <option key={p} value={p}>
              {HUMAN_POLISH_PACKAGE_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-payment">Payment status</Label>
        <select
          id="admin-payment"
          name="paymentStatus"
          defaultValue={filters.paymentStatus || ""}
          className={selectClass}
        >
          <option value="">All payment statuses</option>
          {HUMAN_POLISH_PAYMENT_STATUSES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-rush">Rush</Label>
        <select
          id="admin-rush"
          name="rush"
          defaultValue={filters.rush || ""}
          className={selectClass}
        >
          <option value="">Any rush state</option>
          <option value="requested">Requested</option>
          <option value="approved">Approved</option>
          <option value="none">Not requested</option>
        </select>
      </div>

      <div className="flex items-end gap-2 md:col-span-2">
        <Button type="submit">Apply filters</Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/human-polish">Clear</Link>
        </Button>
      </div>
    </form>
  )
}
