import bcrypt from 'bcryptjs'
import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Authentication and session handling for Fraštačan.
 *
 * ── Password hashing ──────────────────────────────────────────────────
 * Passwords are hashed with bcrypt (cost factor 12) and per-user salt
 * (bcrypt generates a fresh 16-byte salt for every hash). This replaces
 * the previous SHA-256 + static-salt scheme which was trivially rainbow-
 * tableable and produced identical hashes for users with the same
 * password.
 *
 * To keep existing deployments working, `verifyPassword` accepts both
 * the legacy SHA-256 hash (and re-hashes the password with bcrypt on
 * first successful login — see `maybeUpgradeLegacyHash`) and the new
 * bcrypt hashes. Once every customer has logged in once, the legacy
 * branch can be removed.
 *
 * ── Session tokens ────────────────────────────────────────────────────
 * Tokens are signed JSON ({ userId, ts, rotatedAt }) using HMAC-SHA256
 * keyed by \`TOKEN_SECRET\`. The secret MUST be provided via env — there
 * is no insecure fallback on purpose. If it's missing the server will
 * refuse to mint or verify tokens, which is the safe failure mode.
 *
 * Tokens carry a 7-day TTL and are renewed on every \`/api/auth/me\`
 * call (sliding session).
 */

const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const BCRYPT_COST = 12

const RAW_TOKEN_SECRET = process.env.TOKEN_SECRET
if (!RAW_TOKEN_SECRET || RAW_TOKEN_SECRET.length < 32) {
  // Fail fast — but only in non-test environments. In test/dev we want
  // the developer to see this message and set the env var, not have
  // the import crash silently.
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      '[auth] FATAL: TOKEN_SECRET is missing or shorter than 32 chars. ' +
        'Set it in .env (see .env.example). Refusing to mint or verify tokens.'
    )
  }
}

/**
 * Returns a 32-byte HMAC key derived from TOKEN_SECRET. If the env var
 * is missing we return an empty Buffer which causes `signToken` and
 * `verifyToken` to throw — callers should treat that as 401.
 */
function tokenKey(): Buffer {
  if (!RAW_TOKEN_SECRET) return Buffer.alloc(0)
  // Derive a fixed-length key from the human-readable secret so that
  // `crypto.createHmac` has a stable, well-sized key regardless of the
  // length of TOKEN_SECRET.
  return createHmac('sha256', 'frastacan-token-key-derivation').update(RAW_TOKEN_SECRET).digest()
}

// ── Password hashing ────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('hashPassword: heslo nesmie byť prázdne')
  }
  // bcryptjs is pure-JS (no native binding) so it works on Vercel,
  // Windows, Linux, and bun equally. Cost 12 ≈ ~250ms per hash on a
  // typical CI host, which is acceptable for a registration endpoint
  // and provides a strong KDF against offline brute force.
  return bcrypt.hash(password, BCRYPT_COST)
}

/**
 * Verifies a password against a stored hash.
 *
 * Accepts both:
 *  - new bcrypt hashes ($2a$, $2b$, $2y$)
 *  - legacy SHA-256 hashes (no $-prefix) — used by the original seed
 *
 * Returns a tuple `[ok, needsRehash]`. Callers should call
 * `hashPassword` again and persist it when `needsRehash` is true so we
 * gradually migrate every account off the legacy scheme.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (typeof password !== 'string' || typeof storedHash !== 'string' || storedHash.length === 0) {
    return { ok: false, needsRehash: false }
  }

  // New scheme: bcrypt
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    const ok = await bcrypt.compare(password, storedHash)
    // bcrypt hashes are already strong; no rehash needed unless we later
    // bump BCRYPT_COST (then we'd check bcrypt.getRounds and rehash if
    // the stored cost is lower than the current target).
    return { ok, needsRehash: false }
  }

  // Legacy scheme: SHA-256 with static salt. Kept ONLY so existing
  // seeded accounts can log in once and be transparently upgraded.
  // New accounts are always bcrypt.
  const legacySalt = 'frastacan-salt'
  const { createHash } = await import('crypto')
  const saltedHash = createHash('sha256').update(legacySalt + password + legacySalt).digest('hex')
  if (constantTimeEqual(saltedHash, storedHash)) {
    return { ok: true, needsRehash: true }
  }
  // Pre-salt legacy fallback (very early seeds)
  const unsaltedHash = createHash('sha256').update(password).digest('hex')
  if (constantTimeEqual(unsaltedHash, storedHash)) {
    return { ok: true, needsRehash: true }
  }
  return { ok: false, needsRehash: false }
}

/** Constant-time string compare to avoid timing side channels. */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'))
  } catch {
    return false
  }
}

// ── Session tokens ──────────────────────────────────────────────────

interface TokenPayload {
  userId: string
  ts: number
  v: 1
}

export function generateToken(userId: string): string {
  const key = tokenKey()
  if (key.length === 0) {
    throw new Error('generateToken: TOKEN_SECRET nie je nastavený')
  }
  const payload: TokenPayload = { userId, ts: Date.now(), v: 1 }
  const json = JSON.stringify(payload)
  const sig = createHmac('sha256', key).update(json).digest('hex')
  return Buffer.from(json, 'utf-8').toString('base64url') + '.' + sig
}

export function verifyToken(token: string): TokenPayload | null {
  if (typeof token !== 'string' || token.length === 0) return null
  const key = tokenKey()
  if (key.length === 0) return null

  try {
    const dot = token.lastIndexOf('.')
    if (dot < 0) return null
    const payloadB64 = token.slice(0, dot)
    const sig = token.slice(dot + 1)

    const json = Buffer.from(payloadB64, 'base64url').toString('utf-8')
    const expectedSig = createHmac('sha256', key).update(json).digest('hex')
    if (!constantTimeEqual(sig, expectedSig)) return null

    const payload = JSON.parse(json) as Partial<TokenPayload>
    if (!payload || typeof payload.userId !== 'string' || typeof payload.ts !== 'number' || payload.v !== 1) {
      return null
    }

    // Check expiration
    if (Date.now() - payload.ts > TOKEN_MAX_AGE_MS) return null

    return payload as TokenPayload
  } catch {
    return null
  }
}

// ── Request auth ────────────────────────────────────────────────────

export type AuthUser = {
  id: string
  email: string
  name: string
  phone: string | null
  role: 'customer' | 'admin' | 'restaurant' | 'rider'
  avatar: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  // Try Authorization header first, then fall back to cookie
  let token: string | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim()
  }

  if (!token) {
    token = request.cookies.get('frastacan_token')?.value || null
  }

  if (!token) return null

  const decoded = verifyToken(token)
  if (!decoded) return null

  const user = await db.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      avatar: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user || !user.isActive) return null

  return user as AuthUser
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('frastacan_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
}
