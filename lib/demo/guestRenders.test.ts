import { describe, it } from "node:test"
import assert from "node:assert/strict"
import { claimGuestRenders, compactSettings, demoImageStoragePath, isOwnStorageUrl, projectTypeFor } from "./guestRenders"

const SB = "https://abc.supabase.co"

describe("guest render helpers", () => {
  it("recognises our own public storage URLs", () => {
    assert.equal(isOwnStorageUrl(`${SB}/storage/v1/object/public/renders/x.png`, SB), true)
    assert.equal(isOwnStorageUrl("https://replicate.delivery/x.png", SB), false)
    assert.equal(isOwnStorageUrl("data:image/png;base64,AAAA", SB), false)
  })
  it("never puts the cookie id in the storage path", () => {
    const p = demoImageStoragePath("my-secret-cookie", 1)
    assert.ok(p.startsWith("demo/"))
    assert.ok(!p.includes("my-secret-cookie"))
  })
  it("keeps only short scalar settings", () => {
    assert.deepEqual(
      compactSettings({ style: "modern", image: "https://x", n: 3, b: true, big: "x".repeat(400), d: "data:image/png", o: { a: 1 } }),
      { style: "modern", n: 3, b: true }
    )
  })
  it("picks the most used Studio for the project", () => {
    assert.equal(projectTypeFor([{ studio_type: "landscape" }, { studio_type: "exterior" }, { studio_type: "landscape" }]), "landscape")
    assert.equal(projectTypeFor([{ studio_type: "landscape" }, { studio_type: "interior" }]), "interior")
  })
})

/** Minimal in-memory stand-in for the Supabase query builder calls claimGuestRenders makes. */
function fakeSupabase(claims: Record<string, unknown>[]) {
  const projects: Record<string, unknown>[] = []
  const renders: Record<string, unknown>[] = []
  const tables: Record<string, Record<string, unknown>[]> = { guest_render_claims: claims, projects, project_renders: renders }
  let seq = 0
  function from(table: string) {
    const rows = tables[table]
    const filters: ((r: Record<string, unknown>) => boolean)[] = []
    let op: "select" | "update" | "insert" = "select"
    let patch: Record<string, unknown> = {}
    let inserted: Record<string, unknown> | null = null
    const q = {
      select() { return q },
      eq(k: string, v: unknown) { filters.push((r) => r[k] === v); return q },
      is(k: string, v: unknown) { filters.push((r) => (r[k] ?? null) === v); return q },
      gt(k: string, v: string) { filters.push((r) => String(r[k]) > v); return q },
      in(k: string, vs: unknown[]) { filters.push((r) => vs.includes(r[k])); return q },
      order() { return q },
      limit() { return q },
      update(p: Record<string, unknown>) { op = "update"; patch = p; return q },
      insert(p: Record<string, unknown>) { op = "insert"; inserted = { id: `${table}-${++seq}`, ...p }; rows.push(inserted); return q },
      single() { return Promise.resolve({ data: inserted, error: null }) },
      then(res: (v: unknown) => void) {
        const hit = rows.filter((r) => filters.every((f) => f(r)))
        if (op === "update") for (const r of hit) Object.assign(r, patch)
        res({ data: hit.map((r) => ({ ...r })), error: null })
      },
    }
    return q
  }
  return { client: { from } as never, projects, renders }
}

describe("claimGuestRenders", () => {
  const future = new Date(Date.now() + 86_400_000).toISOString()
  const past = new Date(Date.now() - 1000).toISOString()
  const row = (id: string, extra: Record<string, unknown> = {}) => ({
    id, demo_cookie_id: "c1", studio_type: "landscape", image_url: `${SB}/storage/v1/object/public/renders/${id}.png`,
    source_image_url: null, created_at: `2026-11-12T00:00:0${id.slice(-1)}Z`, claimed_by: null, expires_at: future, ...extra,
  })

  it("moves unclaimed, unexpired renders into one project, once", async () => {
    const claims = [row("r1"), row("r2"), row("r3", { expires_at: past }), row("r4", { demo_cookie_id: "other" }), row("r5", { claimed_by: "u0" })]
    const { client, projects, renders } = fakeSupabase(claims)
    const first = await claimGuestRenders(client, "u1", "c1")
    assert.equal(first.claimed, 2)
    assert.equal(projects.length, 1)
    assert.equal((projects[0] as { name: string }).name, "Demo renders")
    assert.equal(renders.length, 2)
    assert.ok(renders.every((r) => (r as { credits_used: number }).credits_used === 0))
    assert.equal(claims.filter((c) => c.claimed_by === "u1").length, 2)
    const again = await claimGuestRenders(client, "u1", "c1")
    assert.equal(again.claimed, 0)
    assert.equal(projects.length, 1)
  })

  it("does nothing without a demo cookie", async () => {
    const { client, projects } = fakeSupabase([row("r1")])
    assert.deepEqual(await claimGuestRenders(client, "u1", null), { claimed: 0, projectId: null })
    assert.equal(projects.length, 0)
  })
})
