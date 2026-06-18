/**
 * Cross-platform post-build script.
 *
 * After `next build` runs with `output: "standalone"`, Next.js emits a
 * self-contained server bundle at `.next/standalone/`. Two extra pieces
 * must be copied next to it for the standalone server to actually serve
 * the app on Windows, Linux, and Vercel Build:
 *
 *   1. `.next/static/`  →  `.next/standalone/.next/static/`
 *   2. `public/`        →  `.next/standalone/public/`
 *
 * Historically this was done with `cp -r` in the npm `build` script, but
 * that only works on Unix. This Node script uses `fs.cpSync`, which is
 * available in Node 16.7+ / Bun 1+ and works identically on all OSes.
 *
 * The script is intentionally idempotent and silent on success — it only
 * logs when something goes wrong, so CI logs stay readable.
 */
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

const standaloneDir = join(projectRoot, '.next', 'standalone')
const staticSrc = join(projectRoot, '.next', 'static')
const staticDst = join(standaloneDir, '.next', 'static')
const publicSrc = join(projectRoot, 'public')
const publicDst = join(standaloneDir, 'public')

// Sanity check: standalone output only exists when `output: "standalone"` is
// set in next.config.ts. If it's missing, the build itself failed earlier.
if (!existsSync(standaloneDir)) {
  console.error('[postbuild] Standalone directory not found:', standaloneDir)
  console.error('[postbuild] Make sure `output: "standalone"` is set in next.config.ts.')
  process.exit(1)
}

// Ensure the destination parents exist before copying.
mkdirSync(join(standaloneDir, '.next'), { recursive: true })

// Copy static assets (JS/CSS chunks, fonts, etc.)
if (existsSync(staticSrc)) {
  cpSync(staticSrc, staticDst, { recursive: true, force: true })
} else {
  console.warn('[postbuild] .next/static missing — page chunks may 404 at runtime.')
}

// Copy public assets (logo, manifest, sw.js, etc.)
if (existsSync(publicSrc)) {
  cpSync(publicSrc, publicDst, { recursive: true, force: true })
} else {
  console.warn('[postbuild] public/ missing — favicon/manifest/PWA icons will 404.')
}
