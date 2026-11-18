import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { loadOwnedProject } from "./loadOwnedProject"

type Row = Record<string, unknown>

function mockClient(opts: { project: Row | null; renders?: Row[] }) {
  return {
    from(table: string) {
      const filters: { col: string; val: unknown }[] = []
      const api: {
        select: () => typeof api
        eq: (col: string, val: unknown) => typeof api
        order: () => Promise<{ data: Row[]; error: null }>
        maybeSingle: () => Promise<{ data: Row | null; error: null }>
      } = {
        select() {
          return api
        },
        eq(col, val) {
          filters.push({ col, val })
          return api
        },
        async order() {
          assert.equal(table, "project_renders")
          return { data: opts.renders ?? [], error: null }
        },
        async maybeSingle() {
          assert.equal(table, "projects")
          return { data: opts.project, error: null }
        },
      }
      return api
    },
  }
}

describe("loadOwnedProject", () => {
  it("returns null for logged-out / missing project (NotFound path)", async () => {
    const result = await loadOwnedProject(mockClient({ project: null }) as never, "user-1", "missing")
    assert.equal(result, null)
  })

  it("returns the owned project and renders after session is available (refreshed or not)", async () => {
    const result = await loadOwnedProject(
      mockClient({
        project: {
          id: "proj-1",
          user_id: "user-1",
          name: "Landscape concept · Nov 12",
          project_type: "landscape",
          cover_image: "https://example.com/cover.png",
          share_slug: null,
          is_shared: false,
          presenting_on: null,
          created_at: "2026-11-12T00:00:00Z",
          updated_at: "2026-11-12T01:00:00Z",
        },
        renders: [
          {
            id: "r2",
            project_id: "proj-1",
            user_id: "user-1",
            studio_type: "landscape",
            image_url: "https://example.com/2.png",
            thumbnail_url: null,
            source_image_url: null,
            prompt_summary: null,
            credits_used: 1,
            created_at: "2026-11-12T01:00:00Z",
          },
        ],
      }) as never,
      "user-1",
      "proj-1"
    )
    assert.ok(result)
    assert.equal(result!.project.id, "proj-1")
    assert.equal(result!.renders[0].id, "r2")
    assert.equal(result!.project.renderCount, 1)
  })
})
