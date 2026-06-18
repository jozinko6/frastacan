import type { NextConfig } from "next";

/**
 * Next.js configuration for Fraštačan.
 *
 * SECURITY / QUALITY RULES:
 *  - `ignoreBuildErrors` MUST stay false (or absent). Masking TS / ESLint
 *    errors at build time is forbidden by project policy and lets real bugs
 *    ship to production.
 *  - `output: "standalone"` is enabled so `bun run build` can copy static
 *    assets into `.next/standalone/` (see package.json build script).
 *    The standalone output also keeps the production Docker / Vercel image
 *    small and self-contained.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Note: typescript.ignoreBuildErrors is intentionally NOT set.
  // Build will fail on any TypeScript error, which is the desired behaviour.
};

export default nextConfig;
