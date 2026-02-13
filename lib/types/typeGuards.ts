/**
 * Type guard utilities for safe type narrowing
 * Use these to eliminate TypeScript narrowing errors without using 'any'
 */

export function isString(value: unknown): value is string {
  return typeof value === "string"
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}


