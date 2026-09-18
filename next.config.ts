import type { NextConfig } from "next";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Owner: package E (Docker, Compose, deployment, headers).
 *
 * This file is fifteen lines long, so two people editing it means two edits in
 * one hunk. Both of package E's changes are already here — `output` and
 * `headers()` — so nobody else needs to open it.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const isProduction = process.env.NODE_ENV === "production";

/**
 * The browser PUTs document bytes straight to a Supabase signed URL — see
 * `FileUploadField` — so that origin has to be in `connect-src` or the upload
 * is blocked. Read from the public env var rather than hard-coded, so a project
 * swap does not silently break uploads.
 */
const supabaseOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
})();

/**
 * Report-Only on purpose, and it must stay that way until the inline bootstrap
 * script Next emits is nonce-based. `'unsafe-inline'` in `script-src` is what
 * makes the policy non-binding anyway; enforcing it as written would buy
 * nothing and only invite someone to flip the header name and break the app.
 *
 * What it is worth today: violations show up in the browser console, so the
 * gap between this list and reality is visible before anyone tightens it.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${supabaseOrigin}`.trim(),
  "font-src 'self' data:",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  /**
   * Traces the real dependency graph into `.next/standalone`, so the Docker
   * image copies one folder and skips `node_modules` entirely. Without it the
   * image carries all 559 packages.
   *
   * ───────────────────────────────────────────────────────────────────────────
   * OFF ON VERCEL, and it is not optional. The comment that used to sit here
   * said this was harmless because "Vercel does its own tracing regardless".
   * It is not. On Next 16.3 the deploy dies *after* a completely successful
   * build — compiled, typechecked, all nineteen pages generated — with:
   *
   *     Error: ENOENT: no such file or directory, open
   *     '/vercel/path0/.next/next-server.js.nft.json'
   *
   * thrown from the `onBuildComplete` hook Vercel runs at the end.
   *
   * The exact interaction is Vercel's, not ours: it applies its own
   * `modifyConfig` to the Next config before building ("Applying modifyConfig
   * from Vercel" in the log), and that does not compose with standalone output.
   * Reproducing it locally does not work — a plain `next build` here writes
   * BOTH `.next/standalone/` and that manifest, so the missing file is
   * something Vercel's build does, not something standalone mode does on its
   * own. What is verified is the fix: with `VERCEL` set, the manifest is
   * written; without it, `.next/standalone/` still is.
   * ───────────────────────────────────────────────────────────────────────────
   *
   * `VERCEL` is set to "1" on every Vercel build, local `vercel build`
   * included. Everywhere else — Docker, `next start`, CI — this stays
   * "standalone" and the image keeps working.
   */
  output: process.env.VERCEL ? undefined : "standalone",

  /**
   * Hides the floating Next.js badge in the bottom-left during `next dev`.
   * It sat on top of the console chrome and read as part of the design.
   *
   * Compile and runtime errors are still surfaced on screen — this only
   * removes the route-status indicator, not the error overlay.
   */
  devIndicators: false,

  /**
   * Security headers, applied to every response.
   *
   * HSTS on localhost is a trap — the browser pins it and then refuses plain
   * http on that port for a year, for every project. So it is emitted only
   * when NODE_ENV === "production", which on Vercel is every deployment and
   * on a dev machine is never.
   */
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Redundant with the CSP's `frame-ancestors 'none'`, and kept for the
          // browsers that still only read this one.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
          ...(isProduction
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
