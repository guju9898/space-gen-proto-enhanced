import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
  agentDocsDirective,
  developersHtmlParitySegments,
  developersMarkdown,
  llmsTxt,
  prefersMarkdown,
} from "./developersMarkdown"

describe("agent-friendly developer docs", () => {
  it("llms.txt follows llmstxt.org shape with Docs links to .md", () => {
    const text = llmsTxt()
    assert.match(text, /^# Renderspace\n/)
    assert.match(text, /^> /m)
    assert.match(text, /^## Docs\n/m)
    assert.match(text, /\[Developers\]\(https:\/\/www\.renderspace\.ai\/developers\.md\)/)
    assert.match(text, /^## Optional\n/m)
    assert.match(text, /openapi\/v1\.yaml/)
  })

  it("developers Markdown includes the agent directive and core endpoints", () => {
    const md = developersMarkdown()
    assert.ok(md.startsWith(agentDocsDirective()))
    assert.match(md, /llms\.txt/)
    assert.match(md, /\/api\/v1\/renders/)
    assert.match(md, /\/api\/v1\/credits/)
    assert.match(md, /Authorization: Bearer/)
  })

  it("Markdown covers every HTML main-content segment (content parity)", () => {
    const md = developersMarkdown()
    const missing = developersHtmlParitySegments().filter((segment) => !md.includes(segment))
    assert.deepEqual(
      missing,
      [],
      `Markdown is missing ${missing.length} HTML segment(s):\n${missing.map((s) => `- ${s}`).join("\n")}`
    )
    const missingPct = (missing.length / developersHtmlParitySegments().length) * 100
    assert.ok(missingPct < 5, `missing ${missingPct.toFixed(1)}% of HTML segments (AFDocs fail is >20%)`)
  })

  it("prefersMarkdown only when Accept includes text/markdown", () => {
    assert.equal(prefersMarkdown(null), false)
    assert.equal(prefersMarkdown("text/html"), false)
    assert.equal(prefersMarkdown("text/markdown"), true)
    assert.equal(prefersMarkdown("text/html, text/markdown;q=0.9"), true)
  })
})
