import Link from "next/link";

import { cn } from "@/lib/cn";
import type { PerfSample, PerfStats } from "@/lib/perf";

import type { PerfMode } from "./explore-params";

/**
 * The on-page readout for the Explore N+1 demonstration.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THE NUMBER IS ON THE PAGE AND NOT IN THE NETWORK TAB.
 *
 * DevTools measures the whole request: TLS, Vercel's cold start, the auth
 * chain, React rendering and the streamed RSC payload. All real, none of it
 * touched by this change — and on a cold lambda the cold start alone can be
 * larger than the thing being measured, which makes a single reload prove
 * nothing either way.
 *
 * This number brackets the search call and nothing else, server-side, inside
 * the request that rendered the page you are looking at. It is the honest
 * measurement of the part that actually changed. Show the Network tab too, as
 * the end-to-end reality check — it will show a smaller percentage, and saying
 * so first is what makes the rest credible.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rendered only when `?perf=` is explicitly in the URL, so a student on the
 * normal Explore page never sees any of this.
 */

const SHELL =
  "rounded-xl border border-[#2a3d30] bg-[#0f1812] px-4 py-4 sm:px-5 " +
  "shadow-[0_10px_40px_rgba(15,24,18,0.18)]";

const STAT_LABEL = "text-[10px] font-bold uppercase tracking-[0.14em] text-white/45";
const STAT_VALUE = "mt-1 text-2xl font-bold tabular-nums leading-none text-white";
const CHIP =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold " +
  "uppercase tracking-[0.1em]";

const ms = (n: number) => `${n.toFixed(1)} ms`;

export type PerfBadgeProps = {
  mode: PerfMode;
  sample: PerfSample;
  fastStats: PerfStats | null;
  legacyStats: PerfStats | null;
  /** Same filters, other implementation. */
  toggleHref: string;
  /** Same filters, history cleared. */
  resetHref: string;
};

export function PerfBadge({
  mode,
  sample,
  fastStats,
  legacyStats,
  toggleHref,
  resetHref,
}: PerfBadgeProps) {
  const isLegacy = mode === "legacy";
  const own = isLegacy ? legacyStats : fastStats;

  // Both arms have to have been run on THIS instance before a comparison means
  // anything. Until then the panel says so rather than showing half a result.
  const bothMeasured =
    fastStats !== null && legacyStats !== null && fastStats.runs > 0 && legacyStats.runs > 0;

  const improvementPct = bothMeasured
    ? ((legacyStats.median - fastStats.median) / legacyStats.median) * 100
    : null;
  const speedup = bothMeasured ? legacyStats.median / fastStats.median : null;

  return (
    <section
      aria-label="Explore performance measurement"
      className={cn(SHELL, "space-y-4")}
    >
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="text-base leading-none text-[#c8ef5a]">
            &#9889;
          </span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
            Explore performance
          </span>
        </div>

        <span
          className={cn(
            CHIP,
            isLegacy
              ? "bg-[#f59e0b]/15 text-[#fbbf24] ring-1 ring-inset ring-[#f59e0b]/35"
              : "bg-[#c8ef5a]/15 text-[#c8ef5a] ring-1 ring-inset ring-[#c8ef5a]/35",
          )}
        >
          {isLegacy ? "Before — N+1" : "After — joined"}
        </span>
      </div>

      {/* this request */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <p className={STAT_LABEL}>Server time</p>
          <p className={STAT_VALUE}>{ms(sample.ms)}</p>
          <p className="mt-1 text-[11px] text-white/40">this request</p>
        </div>

        <div>
          <p className={STAT_LABEL}>SQL queries</p>
          <p className={cn(STAT_VALUE, isLegacy ? "text-[#fbbf24]" : "text-[#c8ef5a]")}>
            {sample.queries}
          </p>
          <p className="mt-1 text-[11px] text-white/40">
            {isLegacy ? "count + rows + 1 per card" : "count + rows"}
          </p>
        </div>

        <div>
          <p className={STAT_LABEL}>Median</p>
          <p className={STAT_VALUE}>{own ? ms(own.median) : "—"}</p>
          <p className="mt-1 text-[11px] text-white/40">
            {own ? `over ${own.runs} run${own.runs === 1 ? "" : "s"}` : "no runs yet"}
          </p>
        </div>

        <div>
          <p className={STAT_LABEL}>Range</p>
          <p className={cn(STAT_VALUE, "text-lg")}>
            {own ? `${own.min.toFixed(0)}–${own.max.toFixed(0)}` : "—"}
          </p>
          <p className="mt-1 text-[11px] text-white/40">min–max ms</p>
        </div>
      </div>

      {/* the comparison */}
      <div className="rounded-lg border border-[#2a3d30] bg-[#0a120e] px-4 py-3.5">
        {bothMeasured ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">
              Median, this instance
            </span>

            <span className="text-sm font-semibold tabular-nums text-white">
              <span className="text-[#fbbf24]">{ms(legacyStats.median)}</span>
              <span className="mx-2 text-white/30" aria-hidden="true">
                &rarr;
              </span>
              <span className="text-[#c8ef5a]">{ms(fastStats.median)}</span>
            </span>

            <span className="rounded-md bg-[#c8ef5a] px-2.5 py-1 text-sm font-bold tabular-nums text-[#0b120e]">
              {improvementPct!.toFixed(1)}% faster
            </span>

            <span className="text-sm font-semibold tabular-nums text-white/70">
              {speedup!.toFixed(2)}&times; speedup
            </span>

            <span className="text-[11px] text-white/40">
              n={legacyStats.runs} before, n={fastStats.runs} after
            </span>
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-white/55">
            Run <strong className="text-white/80">both</strong> versions at least once on this
            server instance to get a comparison. Reload a few times on each side — the median
            settles after about five runs, and a single sample over a network is not evidence.
          </p>
        )}
      </div>

      {/* controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={toggleHref}
          prefetch={false}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-4 text-[13px] font-semibold",
            "transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1812]",
            isLegacy
              ? "bg-[#c8ef5a] text-[#0b120e] hover:bg-[#d6f57a]"
              : "bg-[#f59e0b] text-[#1a1205] hover:bg-[#fbbf24]",
          )}
        >
          {isLegacy ? "Run the AFTER version →" : "Run the BEFORE version →"}
        </Link>

        <Link
          href={resetHref}
          prefetch={false}
          className={cn(
            "inline-flex h-9 items-center rounded-lg border border-[#2a3d30] px-3",
            "text-[13px] font-medium text-white/60 hover:border-[#c8ef5a]/40 hover:text-white",
            "transition-colors duration-150 motion-reduce:transition-none",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f1812]",
          )}
        >
          Reset history
        </Link>

        <span className="text-[11px] text-white/35">
          Prefetch is off on both, so every click is a real request.
        </span>
      </div>

      {/* the receipts */}
      <details className="group">
        <summary
          className={cn(
            "cursor-pointer list-none text-[12px] font-semibold text-white/55",
            "hover:text-[#c8ef5a] focus-visible:outline-none focus-visible:text-[#c8ef5a]",
          )}
        >
          <span aria-hidden="true" className="inline-block transition-transform group-open:rotate-90">
            &#9656;
          </span>{" "}
          Show the {sample.queries} SQL statement{sample.queries === 1 ? "" : "s"} this request
          issued
        </summary>

        <ol className="mt-3 space-y-1">
          {sample.statements.map((statement, i) => (
            <li
              key={i}
              className="flex gap-2.5 rounded border border-[#1b2a21] bg-[#080e0b] px-2.5 py-1.5"
            >
              <span className="shrink-0 tabular-nums text-[11px] font-bold text-white/30">
                {String(i + 1).padStart(2, "0")}
              </span>
              <code className="min-w-0 break-all font-mono text-[11px] leading-relaxed text-white/60">
                {statement.length > 160 ? `${statement.slice(0, 160)}…` : statement}
              </code>
            </li>
          ))}
        </ol>

        {isLegacy && (
          <p className="mt-3 text-[12px] leading-relaxed text-white/45">
            Statements 3 onwards are the N+1: the same four-table join
            (student_profiles &rarr; classes &rarr; batches &rarr; departments), once per card,
            each fetching one short string &mdash; the department and batch line under the
            student&rsquo;s name. The pool is capped at 5 connections, so the twelve do not even
            run at once &mdash; they drain in three waves.
          </p>
        )}
      </details>
    </section>
  );
}
