import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"
import { serviceDb } from "@/lib/api/v1/keys"

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

export function signWebhookBody(secret: string, body: string): string {
  const digest = createHmac("sha256", secret).update(body, "utf8").digest("hex")
  return `sha256=${digest}`
}

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google",
  "kubernetes.default",
  "kubernetes.default.svc",
])

function isPrivateOrMetadataIp(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase()

  if (host === "::1" || host === "0:0:0:0:0:0:0:1") return true
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) return true

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)
  if (!ipv4) return false
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
  return false
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

export function buildWebhookPayload(row: WebhookRenderPayloadSource) {
  return {
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

async function deliverOne(
  webhook: ApiWebhookRow,
  body: string,
  signature: string
): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Renderspace-Signature": signature,
        "User-Agent": "Renderspace-Webhooks/1.0",
      },
      body,
      signal: controller.signal,
      redirect: "error",
    })
    if (!res.ok) {
      console.error(
        "[api/v1/webhooks] delivery non-2xx",
        webhook.id,
        webhook.url,
        res.status
      )
    }
  } catch (error) {
    console.error("[api/v1/webhooks] delivery failed", webhook.id, webhook.url, error)
  } finally {
    clearTimeout(timer)
  }
}

/** Fire-and-forget POST to each active webhook. Never throws to callers. */
export function notifyRenderWebhooks(userId: string, row: WebhookRenderPayloadSource): void {
  if (row.status !== "completed" && row.status !== "failed") return

  void (async () => {
    try {
      const db = serviceDb()
      if (!db) {
        console.error("[api/v1/webhooks] service db unavailable")
        return
      }
      const { data, error } = await db
        .from("api_webhooks")
        .select("id, user_id, url, secret_encrypted, active, created_at")
        .eq("user_id", userId)
        .eq("active", true)
      if (error) {
        console.error("[api/v1/webhooks] list failed", error.message)
        return
      }
      const hooks = (data || []) as ApiWebhookRow[]
      if (hooks.length === 0) return

      const body = JSON.stringify(buildWebhookPayload(row))
      await Promise.all(
        hooks.map(async (hook) => {
          try {
            const secret = decryptWebhookSecret(hook.secret_encrypted)
            const signature = signWebhookBody(secret, body)
            await deliverOne(hook, body, signature)
          } catch (err) {
            console.error("[api/v1/webhooks] sign/deliver error", hook.id, err)
          }
        })
      )
    } catch (error) {
      console.error("[api/v1/webhooks] notify failed", error)
    }
  })()
}
