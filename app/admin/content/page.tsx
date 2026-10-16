import Link from "next/link"
import { AdminErrorState } from "@/components/human-polish/admin/AdminStates"
import {
  RenderReviewButtons,
  RunNowButton,
  SourceUploader,
  WriteAllSeoButton,
} from "@/components/admin/content/ContentAdminClient"
import { requireHumanPolishAdminPage } from "@/lib/human-polish/admin-page-auth"
import { reviewSource } from "@/lib/content/admin-actions"
import { DAILY_RENDER_TARGET } from "@/lib/content/run"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// "Run now", "Write SEO text for all" and approve-with-SEO-text can take a few minutes.
export const maxDuration = 300

type SourceRow = {
  id: string
  kind: string
  scene: string
  public_url: string | null
  credit: string | null
  status: string
  times_used: number | null
  notes: string | null
}

type JobRow = {
  id: string
  batch_date: string
  status: string
  title: string | null
  alt_text: string | null
  result_url: string | null
  error: string | null
  source_id: string | null
  created_by: string
  qc_score: number | null
  qc_notes: string | null
  description: string | null
  published: boolean
  public_slug: string | null
  review_status: string
}

const VIEWS = [
  { key: "review", label: "To review" },
  { key: "published", label: "Published" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
] as const
type View = (typeof VIEWS)[number]["key"]

function inView(j: JobRow, view: View): boolean {
  if (view === "all") return true
  if (view === "published") return j.published
  if (view === "rejected") return j.review_status === "rejected"
  return !j.published && j.review_status !== "rejected" && j.status !== "failed"
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ContentAdminPage({ searchParams }: { searchParams: SearchParams }) {
  const auth = await requireHumanPolishAdminPage("/admin/content")
  if ("forbidden" in auth) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdminErrorState message={auth.error} />
      </main>
    )
  }

  const params = await searchParams
  const rawView = Array.isArray(params.view) ? params.view[0] : params.view
  const view: View = VIEWS.some((v) => v.key === rawView) ? (rawView as View) : "review"

  const [{ data: sources, error: sourcesError }, { data: jobs, error: jobsError }] = await Promise.all([
    auth.supabase
      .from("content_sources")
      .select("id, kind, scene, public_url, credit, status, times_used, notes")
      .order("created_at", { ascending: false })
      .limit(200),
    auth.supabase
      .from("content_render_jobs")
      .select(
        "id, batch_date, status, title, alt_text, result_url, error, source_id, created_by, qc_score, qc_notes, description, published, public_slug, review_status"
      )
      .order("created_at", { ascending: false })
      .limit(150),
  ])

  const sourceRows = (sources ?? []) as SourceRow[]
  const jobRows = ((jobs ?? []) as JobRow[]).filter((j) => j.status !== "queued" || view === "all")
  const own = sourceRows.filter((s) => s.kind === "own" && s.status !== "rejected")
  const stockReview = sourceRows.filter((s) => s.kind === "stock" && s.status === "review")
  const stockDownloading = sourceRows.filter((s) => s.status === "pending_ingest").length
  const stockApproved = sourceRows.filter((s) => s.kind === "stock" && s.status === "ready")
  const rejectedSources = sourceRows.filter((s) => s.status === "rejected")

  const counts = Object.fromEntries(VIEWS.map((v) => [v.key, jobRows.filter((j) => inView(j, v.key)).length])) as Record<View, number>
  const shown = jobRows.filter((j) => inView(j, view))
  const missingSeo = jobRows.filter((j) => j.status === "done" && j.review_status !== "rejected" && !j.description).length

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      {(sourcesError || jobsError) && (
        <AdminErrorState message={`Could not load content tables. ${sourcesError?.message ?? ""} ${jobsError?.message ?? ""}`} />
      )}

      <section id="renders" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Renders</h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              Approve to publish a render to the public gallery (it gets its own page at /gallery/&lt;name&gt;), or reject it.
              QC is an automatic quality score from 1 to 10; 8 and up is usually safe. Renders without SEO text get it written
              when you approve them.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <WriteAllSeoButton missing={missingSeo} />
            <RunNowButton />
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Filter renders">
          {VIEWS.map((v) => (
            <Link
              key={v.key}
              href={`/admin/content?view=${v.key}#renders`}
              className={`rounded-full border px-3 py-1 text-sm ${view === v.key ? "border-white bg-white text-black" : "border-[#343434] text-muted-foreground hover:text-white"}`}
            >
              {v.label} · {counts[v.key]}
            </Link>
          ))}
        </nav>

        {shown.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {view === "review" ? "Nothing waiting for review. New renders arrive every morning." : "Nothing here."}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((j) => (
              <figure
                key={j.id}
                className={`overflow-hidden rounded-lg border bg-[#0d1119] ${j.published ? "border-emerald-500/60" : j.review_status === "rejected" ? "border-red-500/40 opacity-60" : "border-[#343434]"}`}
              >
                {j.result_url ? (
                  <a href={j.result_url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={j.result_url} alt={j.alt_text ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                  </a>
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center p-3 text-center text-xs text-muted-foreground">
                    {j.status === "failed" ? `Failed: ${j.error ?? "unknown"}` : j.status}
                  </div>
                )}
                <figcaption className="space-y-1.5 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{j.title ?? "Untitled"}</p>
                    {j.qc_score != null && (
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 font-mono ${j.qc_score >= 8 ? "bg-emerald-500/20 text-emerald-300" : j.qc_score >= 6 ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}
                      >
                        QC {j.qc_score}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground">
                    {j.batch_date} · {j.source_id ? "from photo" : "text only"}
                    {j.published ? " · published" : j.review_status === "rejected" ? " · rejected" : ""}
                    {j.qc_notes && j.qc_notes !== "clean" ? ` · ${j.qc_notes}` : ""}
                  </p>
                  {j.description ? (
                    <p className="line-clamp-3 text-muted-foreground">{j.description}</p>
                  ) : j.status === "done" ? (
                    <p className="text-amber-300/80">No SEO text yet</p>
                  ) : null}
                  {j.status === "done" && j.result_url && (
                    <RenderReviewButtons
                      id={j.id}
                      reviewStatus={j.review_status}
                      published={j.published}
                      hasSeoText={Boolean(j.description)}
                      publicSlug={j.public_slug}
                    />
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Stock photos to review ({stockReview.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The editor bot finds free-license &quot;before&quot; photos. The render bot only uses the ones you approve.
            {stockDownloading > 0 ? ` ${stockDownloading} more are downloading and will appear here after the next morning run.` : ""}
          </p>
        </div>
        <SourceGrid rows={stockReview} empty="Nothing waiting for review." mode="review" />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your photos ({own.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The render bot uses your photos first, then approved stock photos, then text-only concepts. It makes{" "}
            {DAILY_RENDER_TARGET} renders every morning.
          </p>
        </div>
        <SourceUploader />
        <SourceGrid rows={own} empty="No photos yet. Upload a few job-site photos above." mode="approved" />
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Approved stock photos ({stockApproved.length})</h2>
        <SourceGrid rows={stockApproved} empty="None approved yet." mode="approved" />
      </section>

      {rejectedSources.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Rejected photos ({rejectedSources.length})</h2>
          <SourceGrid rows={rejectedSources} empty="" mode="rejected" />
        </section>
      )}
    </main>
  )
}

function SourceGrid({ rows, empty, mode }: { rows: SourceRow[]; empty: string; mode: "review" | "approved" | "rejected" }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {rows.map((s) => (
        <div
          key={s.id}
          className={`overflow-hidden rounded-lg border bg-[#0d1119] ${mode === "review" ? "border-amber-500/50" : "border-[#343434]"} ${mode === "rejected" ? "opacity-50" : ""}`}
        >
          {s.public_url ? (
            <a href={s.public_url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.public_url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
            </a>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-xs text-muted-foreground">{s.status}</div>
          )}
          <div className="space-y-1.5 p-2 text-xs">
            <p>
              {s.scene.replace("_", " ")} · used {s.times_used ?? 0}×
            </p>
            {s.credit && <p className="truncate text-muted-foreground">{s.credit}</p>}
            <div className="flex flex-wrap gap-2 pt-0.5">
              {mode === "review" && (
                <>
                  <SourceButton id={s.id} decision="approve" label="Approve" primary />
                  <SourceButton id={s.id} decision="reject" label="Reject" />
                </>
              )}
              {mode === "approved" && <SourceButton id={s.id} decision="reject" label="Reject" />}
              {mode === "rejected" && <SourceButton id={s.id} decision="restore" label="Restore" />}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function SourceButton({ id, decision, label, primary }: { id: string; decision: string; label: string; primary?: boolean }) {
  return (
    <form action={reviewSource}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="decision" value={decision} />
      <button
        type="submit"
        className={
          primary
            ? "rounded bg-emerald-500 px-2 py-0.5 font-medium text-black"
            : decision === "reject"
              ? "rounded border border-red-400/60 px-2 py-0.5 text-red-300"
              : "underline underline-offset-2"
        }
      >
        {label}
      </button>
    </form>
  )
}
