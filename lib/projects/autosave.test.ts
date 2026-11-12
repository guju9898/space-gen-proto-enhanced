import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { autosaveRender, defaultJobName, projectImagePath } from "./autosave"

function fake() {
  const tables: Record<string, Record<string, unknown>[]> = { projects: [], project_renders: [] }
  let seq = 0
  function from(table: string) {
    const rows = tables[table]
    const filters: ((r: Record<string, unknown>) => boolean)[] = []
    let op = "select"
    let patch: Record<string, unknown> = {}
    let inserted: Record<string, unknown> | null = null
    let head = false
    const q = {
      select(_c?: string, opts?: { head?: boolean }) { head = Boolean(opts?.head); return q },
      eq(k: string, v: unknown) { filters.push((r) => r[k] === v); return q },
      insert(p: Record<string, unknown>) { op = "insert"; inserted = { id: `${table}-${++seq}`, ...p }; rows.push(inserted); return q },
      update(p: Record<string, unknown>) { op = "update"; patch = p; return q },
      maybeSingle() { const hit = rows.filter((r) => filters.every((f) => f(r))); return Promise.resolve({ data: hit[0] ?? null, error: null }) },
      single() { return Promise.resolve({ data: inserted, error: null }) },
      then(res: (v: unknown) => void) {
        const hit = rows.filter((r) => filters.every((f) => f(r)))
        if (op === "update") for (const r of hit) Object.assign(r, patch)
        res(head ? { count: hit.length, error: null } : { data: hit, error: null })
      },
    }
    return q
  }
  return { client: { from } as never, tables }
}

const keep = async (url: string) => (url.startsWith("bad") ? null : `https://sb/storage/v1/object/public/renders/${url.length}.png`)

describe("autosaveRender", () => {
  it("creates a job project on the first render, then adds versions to it", async () => {
    const { client, tables } = fake()
    const first = await autosaveRender(client, { userId: "u1", studioType: "landscape", imageUrl: "https://replicate/x.png", timeZone: "America/Chicago" }, keep)
    assert.ok(!("error" in first))
    if ("error" in first) return
    assert.match(first.projectName, /^Landscape concept · [A-Z][a-z]{2} \d{1,2}$/)
    assert.equal(first.versions, 1)
    const second = await autosaveRender(client, { userId: "u1", studioType: "landscape", imageUrl: "data:image/png;base64,AA", projectId: first.projectId }, keep)
    assert.ok(!("error" in second))
    if ("error" in second) return
    assert.equal(second.projectId, first.projectId)
    assert.equal(second.versions, 2)
    assert.equal(tables.projects.length, 1)
    assert.ok(tables.project_renders.every((r) => String(r.image_url).startsWith("https://sb/")))
  })

  it("never adds to someone else's project", async () => {
    const { client, tables } = fake()
    tables.projects.push({ id: "theirs", user_id: "u2", name: "Their job" })
    const r = await autosaveRender(client, { userId: "u1", studioType: "exterior", imageUrl: "https://x/y.png", projectId: "theirs" }, keep)
    assert.ok(!("error" in r) && r.projectId !== "theirs")
    assert.equal(tables.projects.length, 2)
  })

  it("fails cleanly when the image can't be kept", async () => {
    const { client, tables } = fake()
    const r = await autosaveRender(client, { userId: "u1", studioType: "interior", imageUrl: "bad-url" }, keep)
    assert.ok("error" in r)
    assert.equal(tables.projects.length, 0)
  })

  it("drops non-https source photos and hides the user id in storage paths", async () => {
    const { client, tables } = fake()
    await autosaveRender(client, { userId: "u1", studioType: "interior", imageUrl: "https://x/1.png", sourceImageUrl: "blob:abc" }, keep)
    assert.equal(tables.project_renders[0].source_image_url, null)
    assert.ok(!projectImagePath("user-123").includes("user-123"))
  })

  it("names jobs by Studio and day", () => {
    assert.equal(defaultJobName("interior", new Date("2026-11-12T18:00:00Z"), "America/Chicago"), "Interior concept · Nov 12")
    assert.equal(defaultJobName("exterior", new Date("2026-11-12T03:00:00Z"), "America/Chicago"), "Exterior concept · Nov 11")
  })
})
