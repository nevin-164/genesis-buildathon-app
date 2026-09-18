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
   * Harmless outside Docker: `next dev` and `next start` ignore it, and Vercel
   * does its own tracing regardless.
   */
  output: "standalone",

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
