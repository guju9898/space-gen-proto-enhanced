// Run: pnpm exec tsx --test lib/api/v1/usage.test.ts
import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { toUsageItem, type ApiRenderRow } from "@/lib/api/v1/renders"

describe("public API usage projection", () => {
  it("maps api_renders rows for the profile panel", () => {
    const row = {
      id: "11111111-2222-3333-4444-555555555555",
      user_id: "user-1",
      api_key_id: "key-1",
      space_type: "exterior",
      status: "completed",
      prompt: "secret prompt",
      instruction: "add path lights",
      options: {},
      source_image_url: "https://example.com/source.jpg",
      result_image_url: "https://example.com/result.jpg",
      result_storage_path: "api/results/x.jpg",
      error_message: null,
      credits_charged: 2,
      idempotency_key: "job-1",
      created_at: "2026-11-08T12:00:00.000Z",
      completed_at: "2026-11-08T12:01:00.000Z",
    } satisfies ApiRenderRow

    assert.deepEqual(toUsageItem(row), {
      id: row.id,
      status: "completed",
      space_type: "exterior",
      credits_charged: 2,
      created_at: row.created_at,
      image_url: row.result_image_url,
    })
  })
})
