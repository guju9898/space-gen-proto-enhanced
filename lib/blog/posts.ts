import fs from "fs"
import path from "path"
import { parseFrontmatter, toBlogPostMeta } from "./markdown"
import { markdownToHtml } from "./render"
import type { BlogPost, BlogPostMeta } from "./types"

const CONTENT_DIR = path.join(process.cwd(), "content", "blog")

function readPostFile(filename: string): BlogPost {
  const fullPath = path.join(CONTENT_DIR, filename)
  const raw = fs.readFileSync(fullPath, "utf8")
  const { data, content } = parseFrontmatter(raw)
  const fallbackSlug = filename.replace(/\.md$/, "")
  const meta = toBlogPostMeta(data, fallbackSlug)
  return {
    ...meta,
    contentMarkdown: content,
    contentHtml: markdownToHtml(content),
  }
}

export function getAllPostMetas(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
  const posts = files.map((f) => {
    const post = readPostFile(f)
    const { contentMarkdown: _m, contentHtml: _h, ...meta } = post
    return meta
  })
  return posts.sort((a, b) => b.datePublished.localeCompare(a.datePublished))
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(CONTENT_DIR)) return []
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
  return files
    .map((f) => readPostFile(f))
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished))
}

export function getPostBySlug(slug: string): BlogPost | null {
  const filename = `${slug}.md`
  const fullPath = path.join(CONTENT_DIR, filename)
  if (!fs.existsSync(fullPath)) return null
  return readPostFile(filename)
}

export function getRelatedPosts(post: BlogPostMeta): BlogPostMeta[] {
  const all = getAllPostMetas()
  const bySlug = new Map(all.map((p) => [p.slug, p]))
  return post.relatedSlugs
    .map((s) => bySlug.get(s))
    .filter((p): p is BlogPostMeta => Boolean(p))
}
