import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },

  /**
   * Hides the floating Next.js badge in the bottom-left during `next dev`.
   * It sat on top of the console chrome and read as part of the design.
   *
   * Compile and runtime errors are still surfaced on screen — this only
   * removes the route-status indicator, not the error overlay.
   */
  devIndicators: false,
};

export default nextConfig;
