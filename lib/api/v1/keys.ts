import { createHash, randomBytes } from "crypto"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const KEY_PREFIX = "rs_live_"

export type ApiKeyRow = {
  id: string
  user_id: string
  name: string
  key_prefix: string
  key_hash: string
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

function pepper(): string {
  return process.env.API_KEY_PEPPER || process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(`${pepper()}:${plaintext}`, "utf8").digest("hex")
}

export function generateApiKeyPlaintext(): { plaintext: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString("base64url")
  const plaintext = `${KEY_PREFIX}${secret}`
  const prefix = plaintext.slice(0, 16)
  return { plaintext, prefix, hash: hashApiKey(plaintext) }
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization")
  if (header) {
    const match = header.match(/^Bearer\s+(.+)$/i)
    if (match?.[1]) return match[1].trim()
  }
  const alt = request.headers.get("x-api-key") || request.headers.get("X-API-Key")
  return alt?.trim() || null
}

export function looksLikeApiKey(token: string): boolean {
  return token.startsWith(KEY_PREFIX) && token.length >= 24
}

export function serviceDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function lookupApiKey(
  db: SupabaseClient,
  plaintext: string
): Promise<ApiKeyRow | null> {
  if (!looksLikeApiKey(plaintext)) return null
  const keyHash = hashApiKey(plaintext)
  const { data, error } = await db
    .from("api_keys")
    .select("id, user_id, name, key_prefix, key_hash, last_used_at, revoked_at, created_at")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .maybeSingle()
  if (error || !data) return null
  return data as ApiKeyRow
}

export async function touchApiKey(db: SupabaseClient, keyId: string): Promise<void> {
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyId)
}

export async function createApiKeyForUser(
  db: SupabaseClient,
  userId: string,
  name: string
): Promise<{ row: ApiKeyRow; plaintext: string }> {
  const generated = generateApiKeyPlaintext()
  const { data, error } = await db
    .from("api_keys")
    .insert({
      user_id: userId,
      name: name.trim() || "Default",
      key_prefix: generated.prefix,
      key_hash: generated.hash,
    })
    .select("id, user_id, name, key_prefix, key_hash, last_used_at, revoked_at, created_at")
    .single()
  if (error || !data) {
    throw new Error(error?.message || "Could not create API key")
  }
  return { row: data as ApiKeyRow, plaintext: generated.plaintext }
}

export async function listApiKeysForUser(db: SupabaseClient, userId: string): Promise<ApiKeyRow[]> {
  const { data, error } = await db
    .from("api_keys")
    .select("id, user_id, name, key_prefix, key_hash, last_used_at, revoked_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw new Error(error.message)
  return (data || []) as ApiKeyRow[]
}

export async function revokeApiKeyForUser(
  db: SupabaseClient,
  userId: string,
  keyId: string
): Promise<boolean> {
  const { data, error } = await db
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("user_id", userId)
    .is("revoked_at", null)
    .select("id")
  if (error) throw new Error(error.message)
  return Array.isArray(data) && data.length > 0
}
