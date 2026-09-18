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
   * Package E replaces this list. It is empty rather than absent so that the
   * function, its shape and its return type are already settled — filling an
   * array in an existing function is a change nobody else can collide with.
   *
   * Worth having, in rough order of value here:
   *   Strict-Transport-Security   max-age=31536000; includeSubDomains
   *   X-Content-Type-Options      nosniff
   *   Referrer-Policy             strict-origin-when-cross-origin
   *   X-Frame-Options             DENY
   *   Content-Security-Policy     start in Report-Only; a strict CSP will fight
   *                               Next's inline bootstrap script until it is
   *                               nonce-based, and a broken page is worse than
   *                               a missing header
   *
   * HSTS on localhost is a trap — the browser pins it and then refuses plain
   * http on that port for a year, for every project. Emit it only when
   * NODE_ENV === "production".
   */
  async headers() {
    return [];
  },
};

export default nextConfig;
