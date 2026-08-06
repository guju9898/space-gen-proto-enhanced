import Link from "next/link"
import { AdminActionsPanel } from "@/components/human-polish/admin/AdminActionsPanel"
import { AdminErrorState } from "@/components/human-polish/admin/AdminStates"
import { AdminOpenFileButton } from "@/components/human-polish/admin/AdminOpenFileButton"
import { requireHumanPolishAdmin } from "@/lib/human-polish/admin-auth"
import { getHumanPolishAdminRequest } from "@/lib/human-polish/admin-queries"
import {
  deliveryClockLabel,
  familyLabel,
  formatAdminDate,
  packageLabel,
  paymentStatusLabel,
  shortRequestId,
  statusLabel,
} from "@/lib/human-polish/admin-utils"
import { HUMAN_POLISH_FILE_TYPE_LABELS, isHumanPolishFileType } from "@/lib/human-polish/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatAmountFromCents } from "@/lib/human-polish/email"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm whitespace-pre-wrap break-words">{value || "—"}</dd>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

export default async function HumanPolishAdminDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const auth = await requireHumanPolishAdmin()
  if (!auth.ok) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8">
        <AdminErrorState message={auth.error} />
      </main>
    )
  }

  const { requestId } = await params
  const result = await getHumanPolishAdminRequest(auth.supabase, requestId)

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Button variant="outline" asChild>
          <Link href="/admin/human-polish">Back to list</Link>
        </Button>
        <AdminErrorState message={result.error} />
      </main>
    )
  }

  const { request: row, files } = result
  const amount =
    typeof row.quoted_amount === "number"
      ? formatAmountFromCents(row.quoted_amount, row.currency)
      : typeof row.standard_amount === "number"
        ? formatAmountFromCents(
            Math.max(0, row.standard_amount - (row.discount_amount || 0)),
            row.currency
          )
        : "—"

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/human-polish">Back to list</Link>
          </Button>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">
            Request {shortRequestId(row.id)}
          </h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{row.id}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{statusLabel(row.status)}</Badge>
            <Badge variant="secondary">{paymentStatusLabel(row.payment_status)}</Badge>
            <Badge variant="secondary">
              Clock: {deliveryClockLabel(row.delivery_clock_started_at)}
            </Badge>
          </div>
        </div>
      </div>

      <Section title="Customer">
        <Field label="Name" value={row.contact_name} />
        <Field label="Email" value={row.contact_email} />
        <Field label="Phone" value={row.contact_phone} />
        <Field label="Company" value={row.company_name} />
        <Field label="Role" value={row.customer_role} />
        <Field label="Preferred contact" value={row.preferred_contact_method} />
      </Section>

      <Section title="Package and payment">
        <Field label="Service family" value={familyLabel(row.family)} />
        <Field label="Requested package" value={packageLabel(row.requested_package)} />
        <Field label="Approved package" value={packageLabel(row.approved_package)} />
        <Field label="Amount" value={amount} />
        <Field label="Promotion" value={row.promotion_type} />
        <Field
          label="Subscriber discount"
          value={row.subscriber_discount_applied ? "Yes" : "No"}
        />
        <Field label="Manual quote required" value={row.manual_quote_required ? "Yes" : "No"} />
        <Field label="Payment status" value={paymentStatusLabel(row.payment_status)} />
      </Section>

      <Section title="Project information">
        <Field label="Project type" value={row.project_type?.replace(/_/g, " ")} />
        <Field label="Project name" value={row.project_name} />
        <Field label="City / state" value={[row.project_city, row.project_state].filter(Boolean).join(", ")} />
        <Field label="Address" value={row.project_address} />
        <Field label="Deadline" value={row.deadline_date} />
        <Field label="Budget band" value={row.budget_band} />
        <Field label="Lead source" value={row.lead_source} />
        <Field label="Intake method" value={row.intake_method} />
      </Section>

      <Section title="Design brief">
        <Field label="Brief" value={row.brief_text} />
        <Field label="Objectives" value={row.design_objectives} />
        <Field label="Must-have" value={row.must_have_elements} />
        <Field label="Avoid" value={row.avoid_elements} />
        <Field label="Materials" value={row.material_preferences} />
        <Field label="Client words" value={row.client_words} />
        <Field label="Success definition" value={row.success_definition} />
      </Section>

      <Section title="Acknowledgments">
        <Field label="Scope confirmed" value={row.scope_confirmed ? "Yes" : "No"} />
        <Field label="Scope confirmed at" value={formatAdminDate(row.scope_confirmed_at)} />
        <Field label="Terms accepted at" value={formatAdminDate(row.terms_accepted_at)} />
        <Field label="Marketing permission" value={row.marketing_permission ? "Yes" : "No"} />
        <Field label="Has approved concept" value={row.has_approved_concept ? "Yes" : "No"} />
        <Field label="Has property survey" value={row.has_property_survey ? "Yes" : "No"} />
        <Field label="Second property requested" value={row.second_property_requested ? "Yes" : "No"} />
        <Field label="Branding requested" value={row.branding_requested ? "Yes" : "No"} />
      </Section>

      <Section title="Operations">
        <Field label="Created" value={formatAdminDate(row.created_at)} />
        <Field label="Updated" value={formatAdminDate(row.updated_at)} />
        <Field label="Assigned to" value={row.assigned_to} />
        <Field label="Rush requested" value={row.rush_requested ? "Yes" : "No"} />
        <Field label="Rush approved" value={row.rush_approved ? "Yes" : "No"} />
        <Field label="Files accepted at" value={formatAdminDate(row.files_accepted_at)} />
        <Field
          label="Delivery clock started"
          value={formatAdminDate(row.delivery_clock_started_at)}
        />
        <Field
          label="First batch delivered"
          value={formatAdminDate(row.first_batch_delivered_at)}
        />
        <Field label="Final delivered" value={formatAdminDate(row.final_delivered_at)} />
        <Field label="Revision count" value={String(row.revision_count)} />
        <Field label="Rights request sent" value={row.rights_request_sent ? "Yes" : "No"} />
        <Field
          label="Rights permission granted"
          value={row.rights_permission_granted ? "Yes" : "No"}
        />
      </Section>

      <section className="space-y-4 rounded-xl border border-[#343434] bg-[#0d1119]/60 p-4">
        <h3 className="text-lg font-semibold">Uploaded files</h3>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground" role="status">
            No files uploaded for this request.
          </p>
        ) : (
          <ul className="space-y-3">
            {files.map((file) => (
              <li
                key={file.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#343434] px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{file.original_filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {isHumanPolishFileType(file.file_type)
                      ? HUMAN_POLISH_FILE_TYPE_LABELS[file.file_type]
                      : file.file_type}{" "}
                    · {(file.size_bytes / (1024 * 1024)).toFixed(2)} MB · {file.mime_type}
                  </p>
                </div>
                <AdminOpenFileButton
                  requestId={row.id}
                  fileId={file.id}
                  filename={file.original_filename}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground">
          Files stay in the private bucket. Open generates a 60-second signed URL after
          admin authorization.
        </p>
      </section>

      <AdminActionsPanel
        requestId={row.id}
        expectedUpdatedAt={row.updated_at}
        status={row.status}
        paymentStatus={row.payment_status}
        rushRequested={row.rush_requested}
        rushApproved={row.rush_approved}
        assignedTo={row.assigned_to}
      />
    </main>
  )
}
