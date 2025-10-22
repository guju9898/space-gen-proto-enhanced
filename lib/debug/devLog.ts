// src/lib/debug/devLog.ts
export const DEV = process.env.NEXT_PUBLIC_DEBUG?.toLowerCase() === "true";

export function devLog(...args: any[]) {
  if (DEV) console.log("[SpaceGen]", ...args);
}
