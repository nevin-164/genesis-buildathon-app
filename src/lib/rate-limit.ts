import "server-only";

import { headers } from "next/headers";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package A (rate limiting).
 *
 * The body is a no-op today and every call site is already in place. Package A
 * replaces what is inside `checkRateLimit`; it does not add a single call, and
 * no other file changes when the real limiter lands.
 *
 * Nobody outside package A edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

/**
 * An options object rather than positional arguments, on purpose.
 *
 * Package A will want a window, a cost, maybe a key prefix. Every one of those
 * is a new positional parameter, and a new positional parameter means opening
 * `login/actions.ts`, `register/actions.ts` and the download route again —
 * which is exactly the merge conflict this seam exists to prevent. Adding an
 * optional field to this object changes no caller.
 */
export type RateLimitOptions = {
  /**
   * What is being limited, already namespaced by the caller:
   * `login:ip:203.0.113.4`, `register:ip:…`, `report:user:<uuid>`.
   */
  key: string;
  /** Requests allowed per window. Package A picks the default per key prefix. */
  limit?: number;
  windowSeconds?: number;
};

/**
 * Allows everything until package A lands.
 *
 * Returning `{ ok: true }` rather than throwing is deliberate: an unconfigured
 * limiter must never be the reason somebody cannot sign in. Package A keeps
 * that property — if `UPSTASH_REDIS_REST_URL` is blank, or Redis is
 * unreachable, this still returns `{ ok: true }`. A limiter that fails closed
 * takes the whole app down with it when Upstash has a bad afternoon.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  void options;
  return { ok: true };
}

/**
 * Best-effort client IP, for use in a rate-limit key.
 *
 * `x-forwarded-for` is a comma-separated chain and the FIRST entry is the
 * client. Behind Vercel this header is set by the platform and can be trusted;
 * on a self-hosted deploy behind an unknown proxy it can be spoofed, so treat
 * an IP key as a speed bump, never as an authorisation decision.
 *
 * Returns "unknown" rather than throwing — every caller wants a key, not an
 * error, and a shared "unknown" bucket is the correct conservative fallback.
 */
export async function clientIp(): Promise<string> {
  const jar = await headers();
  const forwarded = jar.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return jar.get("x-real-ip")?.trim() || "unknown";
}
