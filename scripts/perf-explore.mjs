#!/usr/bin/env node
/**
 * Measure the Explore search, before and after the N+1 fix, against a running
 * deployment.
 *
 * The badge on `/student/explore?perf=…` shows one request at a time, which is
 * what you drive live in front of somebody. This is the other half: the
 * repeated runs that turn those single samples into an average you can put on a
 * scorecard.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT ALTERNATES — before, after, before, after — rather than running twelve of
 * one and then twelve of the other. Two blocks measured minutes apart can
 * differ because the network changed, and that is exactly the objection you do
 * not want to be answering. Alternating puts both arms under the same
 * conditions, and the paired win count at the bottom is the number that settles
 * the argument: "the new code was faster in 12 of 12 head-to-head runs" cannot
 * be explained away as a lucky moment.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * It reports two timings per request, and the difference between them matters:
 *
 *   server   the search call alone, read from the page's own badge. This is the
 *            part the change touched.
 *   http     the whole request as the client saw it — TLS, cold start, auth,
 *            React rendering, the streamed payload. Always a smaller percentage,
 *            and the honest end-to-end number.
 *
 * Usage:
 *   node scripts/perf-explore.mjs --cookie "il_at=…"
 *   node scripts/perf-explore.mjs --cookie "il_at=…" --url https://your.vercel.app --runs 20
 *
 * Get the cookie by signing in as a student in the browser, then copying `il_at`
 * from DevTools → Application → Cookies. It lasts fifteen minutes.
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

const BASE = flag("url", "http://localhost:3000").replace(/\/$/, "");
const RUNS = Number.parseInt(flag("runs", "12"), 10);
const WARMUP = Number.parseInt(flag("warmup", "3"), 10);
const QUERY = flag("q", "");
const COOKIE = flag("cookie", process.env.PERF_COOKIE ?? "");

if (!COOKIE) {
  console.error(
    "Missing session cookie.\n" +
      '  node scripts/perf-explore.mjs --cookie "il_at=…"\n' +
      "Sign in as a student, then copy il_at from DevTools → Application → Cookies.",
  );
  process.exit(1);
}

const url = (mode) => {
  const params = new URLSearchParams();
  if (QUERY) params.set("q", QUERY);
  params.set("perf", mode);
  return `${BASE}/student/explore?${params}`;
};

/** One request: wall-clock time, plus the server timing and query count the badge reports. */
async function hit(mode) {
  const startedAt = performance.now();
  const response = await fetch(url(mode), {
    headers: { cookie: COOKIE },
    redirect: "manual",
    cache: "no-store",
  });
  const body = await response.text();
  const httpMs = performance.now() - startedAt;

  if (response.status !== 200) {
    throw new Error(
      `${url(mode)} answered ${response.status}. ` +
        (response.status === 307 || response.status === 302
          ? "The session cookie is missing or expired — sign in again and re-copy il_at."
          : ""),
    );
  }

  // Both are rendered by the badge. Reading them back out is deliberate: the
  // number on the scorecard is then literally the number on the screen.
  const serverMs = Number.parseFloat(body.match(/>([\d.]+) ms<\/p>/)?.[1] ?? "NaN");
  const queries = Number.parseInt(body.match(/Show the <!-- -->(\d+)/)?.[1] ?? "0", 10);

  if (!Number.isFinite(serverMs)) {
    throw new Error("Could not read the timing from the page — is ?perf= still wired up?");
  }

  return { httpMs, serverMs, queries };
}

const stats = (xs) => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return {
    mean: xs.reduce((a, b) => a + b, 0) / xs.length,
    median:
      sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
};

const pct = (before, after) => ((before - after) / before) * 100;
const pad = (n, w = 9) => n.toFixed(1).padStart(w);

console.log(`\n  ${BASE}/student/explore${QUERY ? `?q=${QUERY}` : ""}`);
console.log(`  ${RUNS} alternating pairs, ${WARMUP} warmup discarded\n`);

for (let i = 0; i < WARMUP; i++) {
  await hit("legacy");
  await hit("fast");
}

const legacy = { http: [], server: [], queries: 0 };
const fast = { http: [], server: [], queries: 0 };
let pairedWins = 0;

console.log("   #   before server   after server    before http    after http");
console.log("  ─────────────────────────────────────────────────────────────");

for (let i = 1; i <= RUNS; i++) {
  const b = await hit("legacy");
  const a = await hit("fast");

  legacy.http.push(b.httpMs);
  legacy.server.push(b.serverMs);
  legacy.queries = b.queries;
  fast.http.push(a.httpMs);
  fast.server.push(a.serverMs);
  fast.queries = a.queries;

  if (a.serverMs < b.serverMs) pairedWins++;

  console.log(
    `  ${String(i).padStart(2)}   ${pad(b.serverMs)} ms   ${pad(a.serverMs)} ms   ` +
      `${pad(b.httpMs)} ms  ${pad(a.httpMs)} ms`,
  );
}

const ls = stats(legacy.server);
const fs_ = stats(fast.server);
const lh = stats(legacy.http);
const fh = stats(fast.http);

const table = (label, before, after) => {
  console.log(`\n  ${label}`);
  console.log(`    before   median ${pad(before.median)} ms   mean ${pad(before.mean)} ms   range ${before.min.toFixed(0)}–${before.max.toFixed(0)}`);
  console.log(`    after    median ${pad(after.median)} ms   mean ${pad(after.mean)} ms   range ${after.min.toFixed(0)}–${after.max.toFixed(0)}`);
  console.log(`    improvement   ${pct(before.median, after.median).toFixed(1)}% by median   ${pct(before.mean, after.mean).toFixed(1)}% by mean   ${(before.median / after.median).toFixed(2)}× speedup`);
};

console.log("\n  ═══════════════════════════════════════════════════════════════");
table("SEARCH OPERATION (server-side — what the change touched)", ls, fs_);
table("WHOLE PAGE (end-to-end — includes render, auth, TLS)", lh, fh);

console.log(`\n  SQL statements per page   ${legacy.queries} → ${fast.queries}`);
console.log(`  Paired wins               new code faster in ${pairedWins}/${RUNS} head-to-head runs`);
console.log("  ═══════════════════════════════════════════════════════════════\n");
