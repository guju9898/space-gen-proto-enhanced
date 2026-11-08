import { NextResponse } from "next/server"
import { logPublicApi5xx } from "@/lib/api/v1/observability"

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "validation_error"
  | "payment_required"
  | "rate_limited"
  | "not_found"
  | "conflict"
  | "internal_error"
  | "configuration_error"

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    details?: unknown
  }
}

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  validation_error: 422,
  payment_required: 402,
  rate_limited: 429,
  not_found: 404,
  conflict: 409,
  internal_error: 500,
  configuration_error: 503,
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
  headers?: HeadersInit,
  meta?: { route?: string; userId?: string | null }
): NextResponse<ApiErrorBody> {
  const status = STATUS[code]
  if (status >= 500) {
    logPublicApi5xx({
      route: meta?.route ?? "/api/v1",
      status,
      code,
      userId: meta?.userId,
      message,
    })
  }
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined ? { details } : {}) } },
    { status, headers }
  )
}

export function apiJson<T>(body: T, init?: { status?: number; headers?: HeadersInit }) {
  return NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers })
}
