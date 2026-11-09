import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto"
import { lookup } from "dns/promises"
import { after } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { serviceDb } from "@/lib/api/v1/keys"
import { logPublicApiEvent } from "@/lib/api/v1/observability"

export type WebhookRenderPayloadSource = {
  id: string
  status: string
  result_image_url: string | null
  credits_charged: number | null
  error_message: string | null
  created_at: string
  completed_at: string | null
}

const SECRET_PREFIX = "whsec_"
const MAX_WEBHOOKS_PER_USER = 5
const DELIVERY_TIMEOUT_MS = 8_000

export type ApiWebhookRow = {
  id: string
  user_id: string
  url: string
  secret_encrypted: string
  active: boolean
  created_at: string
}

export type PublicWebhook = {
  id: string
  url: string
  active: boolean
  created_at: string
}

function pepper(): string {
  return process.env.API_KEY_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

function encryptionKey(): Buffer {
  return createHash("sha256").update(`webhook-secret:${pepper()}`, "utf8").digest()
}

/** AES-256-GCM; payload is base64url(iv || tag || ciphertext). */
export function encryptWebhookSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString("base64url")
}

export function decryptWebhookSecret(payload: string): string {
  const buf = Buffer.from(payload, "base64url")
  if (buf.length < 28) throw new Error("Invalid encrypted secret")
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const ciphertext = buf.subarray(28)
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8")
}

export function generateWebhookSecretPlaintext(): string {
  return `${SECRET_PREFIX}${randomBytes(24).toString("base64url")}`
}

/**
 * HMAC-SHA256 over `${timestamp}.${body}` so a captured delivery can't be replayed later.
 * Receivers recompute it from the X-Renderspace-Timestamp header and the raw body,
 * compare in constant time, and reject timestamps older than ~5 minutes.
 */
export function signWebhookBody(secret: string, body: string, timestamp: string): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex")
  return `sha256=${digest}`
}

export type WebhookEvent = "render.completed" | "render.failed"

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "kubernetes.default",
  "kubernetes.default.svc",
])

function isPrivateIpv4(host: string): boolean | null {
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return null
  const octets = ipv4.slice(1).map((p) => Number(p))
  if (octets.some((n) => n > 255)) return true
  const [a, b] = octets
  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT / some cloud metadata ranges
  if (a >= 224) return true // multicast + reserved
  return false
}

/** True for loopback, private, link-local, CGNAT, metadata and IPv4-mapped private addresses. */
export function isPrivateOrMetadataIp(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase()

  const v4 = isPrivateIpv4(host)
  if (v4 !== null) return v4

  // Only treat the value as IPv6 when it actually is one (hostnames like "fdhooks.com" are fine).
  if (!host.includes(":")) return false
  if (host === "::" || host === "::1" || host === "0:0:0:0:0:0:0:1") return true
  if (/^f[cd][0-9a-f]{0,2}:/.test(host) || /^fe[89ab][0-9a-f]?:/.test(host)) return true
  // IPv4-mapped (::ffff:10.0.0.1 or ::ffff:a00:1) — check the embedded IPv4.
  const mapped = host.match(/^(?:0{0,4}:){0,5}:?ffff:(.+)$/)
  if (mapped) {
    const tail = mapped[1]
    const dotted = isPrivateIpv4(tail)
    if (dotted !== null) return dotted
    const hex = tail.match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/)
    if (hex) {
      const hi = parseInt(hex[1], 16)
      const lo = parseInt(hex[2], 16)
      return isPrivateIpv4(`${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`) ?? true
    }
    return true
  }
  return false
}

/** Resolve the host at delivery time so DNS names pointing at private ranges are refused too. */
async function resolvesToPublicAddress(hostname: string): Promise<boolean> {
  const host = hostname.replace(/^\[|\]$/g, "")
  if (isPrivateOrMetadataIp(host)) return false
  if (/^[\d.]+$/.test(host) || host.includes(":")) return true
  try {
    const addrs = await lookup(host, { all: true, verbatim: true })
    return addrs.length > 0 && addrs.every((a) => !isPrivateOrMetadataIp(a.address))
  } catch {
    return false
  }
}

/**
 * HTTPS only; reject localhost, private, and cloud-metadata style targets.
 * Hostname/IP literal checks only (no DNS resolve) for a light SSRF filter.
 */
export function validateWebhookUrl(raw: string): { ok: true; url: string } | { ok: false; message: string } {
  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    return { ok: false, message: "Invalid webhook URL." }
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, message: "Webhook URL must use https." }
  }
  if (parsed.username || parsed.password) {
    return { ok: false, message: "Webhook URL must not include credentials." }
  }
  const hostname = parsed.hostname.toLowerCase()
  if (!hostname) return { ok: false, message: "Invalid webhook URL." }
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".localhost") || hostname.endsWith(".local")) {
    return { ok: false, message: "Webhook URL host is not allowed." }
  }
  if (isPrivateOrMetadataIp(hostname)) {
    return { ok: false, message: "Webhook URL must not target private or metadata addresses." }
  }
  return { ok: true, url: parsed.toString() }
}

export function toPublicWebhook(row: ApiWebhookRow): PublicWebhook {
  return {
    id: row.id,
    url: row.url,
    active: row.active,
    created_at: row.created_at,
  }
}

export function webhookEventFor(status: string): WebhookEvent | null {
  if (status === "completed") return "render.completed"
  if (status === "failed") return "render.failed"
  return null
}

export function buildWebhookPayload(row: WebhookRenderPayloadSource) {
  return {
    event: webhookEventFor(row.status),
    id: row.id,
    status: row.status,
    image_url: row.result_image_url,
    credits: {
      charged: row.credits_charged,
    },
    error: row.error_message,
    created_at: row.created_at,
    completed_at: row.completed_at,
  }
}

export async function listWebhooksForUser(
  db: SupabaseClient,
  userId: string
): Promise<ApiWebhookRow[]> {
  const { data, error } = await db
    .from("api_webhooks")
    .select("id, user_id, url, secret_encrypted, active, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as ApiWebhookRow[]
}

export async function createWebhookForUser(
  db: SupabaseClient,
  userId: string,
  url: string
): Promise<{ row: ApiWebhookRow; secret: string }> {
  const validated = validateWebhookUrl(url)
  if (!validated.ok) throw new Error(validated.message)

  const existing = await listWebhooksForUser(db, userId)
  if (existing.length >= MAX_WEBHOOKS_PER_USER) {
    throw new Error(`Limit of ${MAX_WEBHOOKS_PER_USER} webhooks per account.`)
  }

  const secret = generateWebhookSecretPlaintext()
  const { data, error } = await db
    .from("api_webhooks")
    .insert({
      user_id: userId,
      url: validated.url,
      secret_encrypted: encryptWebhookSecret(secret),
      active: true,
    })
    .select("id, user_id, url, secret_encrypted, active, created_at")
    .single()
  if (error || !data) {
    throw new Error(error?.message || "Could not create webhook")
  }
  return { row: data as ApiWebhookRow, secret }
}

export async function deleteWebhookForUser(
  db: SupabaseClient,
  userId: string,
  webhookId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("api_webhooks")
    .delete()
    .eq("id", webhookId)
    .eq("user_id", userId)
    .select("id")
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}

function logDelivery(level: "warn" | "error", webhookId: string, message: string, status = 0) {
  // Never log the URL: n8n/Zapier/Make hook URLs embed their own secrets in the path.
  logPublicApiEvent({
    level,
    route: "webhook_delivery",
    status,
    code: "webhook_delivery_failed",
    message: `${message} (webhook ${webhookId})`,
  })
}

async function deliverOne(
  webhook: ApiWebhookRow,
  body: string,
  event: WebhookEvent
): Promise<void> {
  let host: string
  try {
    host = new URL(webhook.url).hostname
  } catch {
    logDelivery("warn", webhook.id, "invalid stored url")
    return
  }
  if (!(await resolvesToPublicAddress(host))) {
    logDelivery("warn", webhook.id, "host did not resolve to a public address; skipped")
    return
  }

  const timestamp = String(Math.floor(Date.now() / 1000))
  const signature = signWebhookBody(decryptWebhookSecret(webhook.secret_encrypted), body, timestamp)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Renderspace-Event": event,
        "X-Renderspace-Timestamp": timestamp,
        "X-Renderspace-Signature": signature,
        "User-Agent": "Renderspace-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
      redirect: "error",
    })
    if (!res.ok) logDelivery("warn", webhook.id, "receiver returned non-2xx", res.status)
  } catch (error) {
    const reason = error instanceof Error && error.name === "AbortError" ? "timed out" : "request failed"
    logDelivery("warn", webhook.id, reason)
  } finally {
    clearTimeout(timer)
  }
}

/** Deliver to every active webhook for this user. Resolves when all attempts finish; never throws. */
export async function deliverRenderWebhooks(userId: string, row: WebhookRenderPayloadSource): Promise<void> {
  const event = webhookEventFor(row.status)
  if (!event) return
  try {
    const db = serviceDb()
    if (!db) {
      logPublicApiEvent({ level: "error", route: "webhook_delivery", status: 503, code: "configuration_error", message: "service db unavailable" })
      return
    }
    const { data, error } = await db
      .from("api_webhooks")
      .select("id, user_id, url, secret_encrypted, active, created_at")
      .eq("user_id", userId)
      .eq("active", true)
    if (error) {
      logPublicApiEvent({ level: "error", route: "webhook_delivery", status: 500, code: "internal_error", message: `webhook lookup failed: ${error.code || "db error"}` })
      return
    }
    const hooks = (data || []) as ApiWebhookRow[]
    if (hooks.length === 0) return

    const body = JSON.stringify(buildWebhookPayload(row))
    await Promise.all(
      hooks.map((hook) =>
        deliverOne(hook, body, event).catch(() => logDelivery("error", hook.id, "could not sign or send"))
      )
    )
  } catch {
    logPublicApiEvent({ level: "error", route: "webhook_delivery", status: 500, code: "internal_error", message: "webhook notify failed" })
  }
}

/**
 * Fire-and-forget: the render response is never delayed by webhook delivery.
 * `after()` keeps the Vercel function alive until delivery finishes; a bare
 * un-awaited promise can be frozen as soon as the response is sent.
 */
export function notifyRenderWebhooks(userId: string, row: WebhookRenderPayloadSource): void {
  if (!webhookEventFor(row.status)) return
  const task = () => deliverRenderWebhooks(userId, row)
  try {
    after(task)
  } catch {
    // Outside a request scope (scripts/tests): run detached.
    void task()
  }
}
