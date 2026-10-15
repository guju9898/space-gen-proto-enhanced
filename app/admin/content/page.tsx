import { AdminErrorState } from "@/components/human-polish/admin/AdminStates"
import { RunNowButton, SourceUploader } from "@/components/admin/content/ContentAdminClient"
import { requireHumanPolishAdminPage } from "@/lib/human-polish/admin-page-auth"
import { setContentSourceStatus, setRenderPublished } from "@/lib/content/admin-actions"
import { DAILY_RENDER_TARGET } from "@/lib/content/run"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
// The "Run now" server action renders for up to ~4 minutes.
export const maxDuration = 300

type SourceRow = {
  id: string
  kind: string
  scene: string
  public_url: string | null
  source_url: string | null
  license: string | null
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
}

export default async function ContentAdminPage() {
  const auth = await requireHumanPolishAdminPage("/admin/content")
  if ("forbidden" in auth) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <AdminErrorState message={auth.error} />
      </main>
    )
  }

  const [{ data: sources, error: sourcesError }, { data: jobs, error: jobsError }] = await Promise.all([
    auth.supabase
      .from("content_sources")
      .select("id, kind, scene, public_url, source_url, license, credit, status, times_used, notes")
      .order("created_at", { ascending: false })
      .limit(120),
    auth.supabase
      .from("content_render_jobs")
      .select("id, batch_date, status, title, alt_text, result_url, error, source_id, created_by, qc_score, qc_notes, description, published, public_slug")
      .order("created_at", { ascending: false })
      .limit(90),
  ])

  const sourceRows = (sources ?? []) as SourceRow[]
  const jobRows = (jobs ?? []) as JobRow[]
  const own = sourceRows.filter((s) => s.kind === "own")
  const stock = sourceRows.filter((s) => s.kind === "stock")

  return (
    <main className="mx-auto max-w-7xl space-y-10 px-4 py-8">
      <section className="space-y-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Your photos</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The daily render bot uses your photos first, then free-license stock photos, then text-only concepts.
            It makes {DAILY_RENDER_TARGET} renders every morning.
          </p>
        </div>
        <SourceUploader />
      </section>

      {(sourcesError || jobsError) && (
        <AdminErrorState
          message={`Could not load content tables. ${sourcesError?.message ?? ""} ${jobsError?.message ?? ""}`}
        />
      )}

      <SourceGrid title={`Your photos (${own.length})`} rows={own} empty="No photos yet. Upload a few job-site photos above." />
      <SourceGrid title={`Stock photos (${stock.length})`} rows={stock} empty="The editor bot adds free-license stock photos here." />

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Recent renders</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Publish the good ones to the public gallery. Each published render gets its own page at /gallery/&lt;name&gt;.
              QC is an automatic quality score (1-10); 8+ is usually safe to publish.
            </p>
          </div>
          <RunNowButton />
        </div>
        {jobRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No renders yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {jobRows.map((j) => (
              <figure
                key={j.id}
                className={`overflow-hidden rounded-lg border bg-[#0d1119] ${j.published ? "border-emerald-500/60" : "border-[#343434]"}`}
              >
                {j.result_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={j.result_url} alt={j.alt_text ?? ""} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center p-3 text-center text-xs text-muted-foreground">
                    {j.status === "failed" ? `Failed: ${j.error ?? "unknown"}` : j.status}
                  </div>
                )}
                <figcaption className="space-y-1.5 p-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm">{j.title ?? "Untitled"}</p>
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
                    {j.qc_notes && j.qc_notes !== "clean" ? ` · ${j.qc_notes}` : ""}
                  </p>
                  {j.description && <p className="line-clamp-3 text-muted-foreground">{j.description}</p>}
                  {j.status === "done" && (
                    <div className="flex items-center gap-3 pt-1">
                      {j.description ? (
                        <form action={setRenderPublished}>
                          <input type="hidden" name="id" value={j.id} />
                          <input type="hidden" name="publish" value={j.published ? "false" : "true"} />
                          <button
                            type="submit"
                            className={j.published ? "underline underline-offset-2" : "rounded bg-white px-2.5 py-1 font-medium text-black"}
                          >
                            {j.published ? "Remove from gallery" : "Publish to gallery"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-muted-foreground">Writing SEO text…</span>
                      )}
                      {j.published && j.public_slug && (
                        <a href={`/gallery/${j.public_slug}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                          View page
                        </a>
                      )}
                    </div>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

function SourceGrid({ title, rows, empty }: { title: string; rows: SourceRow[]; empty: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {rows.map((s) => (
            <div
              key={s.id}
              className={`overflow-hidden rounded-lg border border-[#343434] bg-[#0d1119] ${s.status === "rejected" ? "opacity-40" : ""}`}
            >
              {s.public_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.public_url} alt="" className="aspect-[4/3] w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-xs text-muted-foreground">{s.status}</div>
              )}
              <div className="space-y-1 p-2 text-xs">
                <p>
                  {s.scene.replace("_", " ")} · used {s.times_used ?? 0}×
                </p>
                {s.credit && <p className="truncate text-muted-foreground">{s.credit}</p>}
                <form action={setContentSourceStatus}>
                  <input type="hidden" name="id" value={s.id} />
                  <input type="hidden" name="status" value={s.status === "rejected" ? "ready" : "rejected"} />
                  <button className="underline underline-offset-2" type="submit">
                    {s.status === "rejected" ? "Use again" : "Don't use"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
