import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number };

export type RateLimitOptions = {
  key: string;
  limit?: number;
  windowSeconds?: number;
};

let limiter: Ratelimit | null = null;
let resolved = false;

function getLimiter(): Ratelimit | null {
  if (resolved) return limiter;
  resolved = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return (limiter = null);

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, "600 s"),
    prefix: "internlens",
    analytics: false,
  });

  return limiter;
}

const cache = new Map<string, Ratelimit>();

function limiterFor(limit: number, windowSeconds: number): Ratelimit | null {
  const base = getLimiter();
  if (!base) return null;

  const cacheKey = `${limit}:${windowSeconds}`;
  const existing = cache.get(cacheKey);
  if (existing) return existing;

  const made = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "internlens",
    analytics: false,
  });

  cache.set(cacheKey, made);
  return made;
}

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const limit = options.limit ?? 10;
  const windowSeconds = options.windowSeconds ?? 600;

  const ratelimit = limiterFor(limit, windowSeconds);
  if (!ratelimit) return { ok: true }; // Fail open if unconfigured

  try {
    const result = await ratelimit.limit(options.key);
    if (result.success) return { ok: true };

    // Result.reset is an epoch millisecond timestamp. Convert to seconds from now.
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return { ok: false, retryAfterSeconds };

  } catch (error) {
    // Fail open if Redis is unreachable
    console.error("[rate-limit]", error);
    return { ok: true };
  }
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
