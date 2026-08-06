import Link from "next/link"
import type { HumanPolishAdminListRow } from "@/lib/human-polish/admin-types"
import {
  deliveryClockLabel,
  familyLabel,
  formatAdminDate,
  packageLabel,
  paymentStatusLabel,
  shortRequestId,
  statusLabel,
} from "@/lib/human-polish/admin-utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type Props = {
  rows: HumanPolishAdminListRow[]
}

function YesNo({ value }: { value: boolean }) {
  return value ? (
    <Badge variant="secondary">Yes</Badge>
  ) : (
    <span className="text-muted-foreground">No</span>
  )
}

export function AdminRequestTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-[#343434] bg-[#0d1119]/40 px-6 py-16 text-center text-muted-foreground"
        role="status"
      >
        No Human Polish requests match these filters.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[#343434]">
      <Table>
        <TableHeader>
          <TableRow className="border-[#343434] hover:bg-transparent">
            <TableHead>Request</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Family</TableHead>
            <TableHead>Package</TableHead>
            <TableHead>Project type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Rush req</TableHead>
            <TableHead>Rush OK</TableHead>
            <TableHead>Assigned</TableHead>
            <TableHead>Delivery clock</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-[#343434]">
              <TableCell className="font-mono text-xs">
                <Link
                  href={`/admin/human-polish/${row.id}`}
                  className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {shortRequestId(row.id)}
                </Link>
              </TableCell>
              <TableCell className="whitespace-nowrap text-xs">
                {formatAdminDate(row.created_at)}
              </TableCell>
              <TableCell>{row.contact_name || "—"}</TableCell>
              <TableCell>{row.company_name || "—"}</TableCell>
              <TableCell className="text-xs">{familyLabel(row.family)}</TableCell>
              <TableCell className="text-xs">
                {packageLabel(row.requested_package)}
              </TableCell>
              <TableCell className="text-xs">
                {row.project_type?.replace(/_/g, " ") || "—"}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{statusLabel(row.status)}</Badge>
              </TableCell>
              <TableCell className="text-xs">
                {paymentStatusLabel(row.payment_status)}
              </TableCell>
              <TableCell>
                <YesNo value={row.rush_requested} />
              </TableCell>
              <TableCell>
                <YesNo value={row.rush_approved} />
              </TableCell>
              <TableCell className="text-xs">{row.assigned_to || "—"}</TableCell>
              <TableCell className="text-xs">
                {deliveryClockLabel(row.delivery_clock_started_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
