import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Per-request timing and SQL-statement counting, for the Explore performance
 * demonstration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY ASYNCLOCALSTORAGE AND NOT A MODULE COUNTER.
 *
 * Drizzle's `logger` hook is global — it fires for every query the process
 * makes, from every request in flight. A plain module-scope counter would
 * therefore attribute another user's queries to whoever happens to be
 * measuring, and two concurrent Explore loads would each report roughly double.
 *
 * `AsyncLocalStorage` scopes the count to one async call tree, so `measure()`
 * counts exactly the statements issued by the function it wrapped and nothing
 * else. This is the same mechanism the App Router uses to scope `cookies()` and
 * `headers()` to a request.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Everything here is inert unless something is actively measuring: `recordQuery`
 * is one `getStore()` call that returns undefined on every normal request.
 */

type PerfBucket = { queries: string[] };

const bucket = new AsyncLocalStorage<PerfBucket>();

/**
 * Called by the Drizzle logger in `db/index.ts` for every statement.
 *
 * Outside a `measure()` call this is a no-op, which is the normal case for
 * every request in the app.
 */
export function recordQuery(sql: string): void {
  bucket.getStore()?.queries.push(sql);
}

export type PerfSample = {
  /** Which implementation ran — "legacy" or "fast". */
  label: string;
  /** Wall-clock milliseconds for the measured call, server-side. */
  ms: number;
  /** SQL statements issued inside it. */
  queries: number;
  /** The statements themselves, whitespace-collapsed, for the SQL panel. */
  statements: string[];
};

/**
 * Run `fn`, and report how long it took and how many statements it issued.
 *
 * The timer brackets only `fn`. It deliberately excludes React rendering, the
 * auth chain, TLS and Vercel's cold start — those are real costs, but they are
 * not what this change touches, and folding them in would flatter the result.
 * The browser's own network timing is the honest end-to-end number; this is the
 * honest number for the part that actually changed.
 */
export async function measure<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ result: T; sample: PerfSample }> {
  const store: PerfBucket = { queries: [] };
  const startedAt = performance.now();

  const result = await bucket.run(store, fn);

  const sample: PerfSample = {
    label,
    ms: performance.now() - startedAt,
    queries: store.queries.length,
    statements: store.queries.map((q) => q.replace(/\s+/g, " ").trim()),
  };

  remember(sample);
  return { result, sample };
}

/* ── recent-run history ──────────────────────────────────────────────────── */

/**
 * The last N timings per label, so a reload shows a running average instead of
 * one noisy sample. A single measurement over a network is not evidence; the
 * challenge asks for an average of repeated runs, and this is how you collect
 * one by reloading the page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MODULE SCOPE, SO IT IS PER SERVER INSTANCE — and on Vercel that means per
 * warm lambda. A cold start begins the average again from n=1, and two
 * instances keep two separate histories. The badge prints `n` for exactly that
 * reason: if it resets to 1 mid-demo you have been moved to a new instance, and
 * you should say so rather than have somebody notice it for you.
 *
 * This is demonstration state, not application state. Nothing reads it but the
 * badge, and losing it costs nothing.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const HISTORY_LIMIT = 20;
const history = new Map<string, number[]>();

function remember(sample: PerfSample): void {
  const runs = history.get(sample.label) ?? [];
  runs.push(sample.ms);
  if (runs.length > HISTORY_LIMIT) runs.shift();
  history.set(sample.label, runs);
}

export type PerfStats = {
  runs: number;
  mean: number;
  median: number;
  min: number;
  max: number;
};

/** Stats over the runs this server instance has seen for one label. */
export function recentStats(label: string): PerfStats | null {
  const runs = history.get(label);
  if (!runs || runs.length === 0) return null;

  const sorted = [...runs].sort((a, b) => a - b);
  return {
    runs: sorted.length,
    mean: runs.reduce((a, b) => a + b, 0) / runs.length,
    median: sorted[Math.floor(sorted.length / 2)]!,
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
  };
}

/**
 * Wipe the history, so a demo can start from a clean n=0.
 *
 * The badge compares the two arms on **medians**, not means. The tail on a
 * network measurement is long and one-sided, so a mean over twenty samples is
 * still being steered by the slowest one or two; the median is the number that
 * survives a re-run in front of somebody.
 */
export function resetHistory(): void {
  history.clear();
}
