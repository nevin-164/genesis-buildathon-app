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

/**
 * How long a single limit check may spend talking to Upstash before we give up
 * and let the request through.
 *
 * The package default is 5s, and the REST client's own default is six attempts
 * with exponential backoff (~4.3s of sleeping). Together that means an
 * unreachable Redis — a typo'd host, a paused database, a DNS blip — adds five
 * seconds to *every* sign-in, sign-up and download before failing open. A limit
 * that is about to be ignored anyway should be abandoned quickly, so the retry
 * is cut to one and the whole check is capped below.
 */
const REQUEST_TIMEOUT_MS = 1_000;

/**
 * Shared by every limiter. Built once: a second client would mean a second
 * connection pool and a second telemetry handshake for no gain.
 *
 * `Redis.fromEnv()` is deliberately not used. It silently falls back to
 * `KV_REST_API_URL`/`KV_REST_API_TOKEN`, so reading the variables here and
 * constructing there lets the two disagree — the presence check says
 * "unconfigured" while the client would have connected fine. Both names are
 * read in one place instead.
 */
function readRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  return new Redis({
    url,
    token,
    // One retry, not five. See REQUEST_TIMEOUT_MS.
    retry: { retries: 1, backoff: () => 50 },
  });
}

let redis: Redis | null = null;
let redisResolved = false;

function getRedis(): Redis | null {
  if (!redisResolved) {
    redisResolved = true;
    redis = readRedis();
  }
  return redis;
}

/**
 * One `Ratelimit` per distinct limit/window pair, kept for the life of the
 * process. The instance carries the ephemeral cache that lets an already
 * exhausted identifier be rejected without a round trip, so rebuilding it per
 * request would throw that away.
 */
const limiters = new Map<string, Ratelimit>();

function limiterFor(limit: number, windowSeconds: number): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const cacheKey = `${limit}:${windowSeconds}`;
  const existing = limiters.get(cacheKey);
  if (existing) return existing;

  const made = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "internlens",
    analytics: false,
    timeout: REQUEST_TIMEOUT_MS,
  });

  limiters.set(cacheKey, made);
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
    /*
     * Fail open if Redis is unreachable — an outage at Upstash must not take
     * sign-in down with it.
     *
     * The bucket name is logged, never the full key: keys carry the email
     * address and the user id that identify the bucket, and an error path is
     * not a place to start writing those to the log.
     */
    const bucket = options.key.split(":")[0];
    console.error(`[rate-limit] check failed open for "${bucket}"`, error);
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
