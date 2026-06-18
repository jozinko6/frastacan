import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, hashPassword, generateToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { loginSchema, validateInput } from '@/lib/validations'

// In-memory per-IP rate limiter for login attempts.
// Protects against brute force / credential stuffing. 10 attempts per
// 5-minute window per IP. Reset on success.
//
// For a multi-instance deployment (Vercel with multiple lambdas) this
// should be moved to Upstash Redis or similar — but for the current
// single-instance SQLite deployment this is enough to block the common
// case of scripted brute force.
const LOGIN_WINDOW_MS = 5 * 60 * 1000
const LOGIN_MAX_ATTEMPTS = 10
const loginAttempts = new Map<string, { count: number; firstAt: number }>()

function rateLimit(ip: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || now - entry.firstAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAt: now })
    return { ok: true, retryAfterMs: 0 }
  }
  entry.count += 1
  if (entry.count > LOGIN_MAX_ATTEMPTS) {
    return { ok: false, retryAfterMs: LOGIN_WINDOW_MS - (now - entry.firstAt) }
  }
  return { ok: true, retryAfterMs: 0 }
}

function resetRateLimit(ip: string) {
  loginAttempts.delete(ip)
}

function getClientIp(request: NextRequest): string {
  // Vercel sets x-forwarded-for; the first IP is the original client.
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit
    const ip = getClientIp(request)
    const rl = rateLimit(ip)
    if (!rl.ok) {
      return NextResponse.json(
        { error: 'Príliš veľa pokusov o prihlásenie. Skúste to neskôr.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(loginSchema, body)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    const { email, password } = validation.value

    // Find user
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      // Use a generic message so an attacker can't enumerate accounts.
      return NextResponse.json(
        { error: 'Neplatný email alebo heslo' },
        { status: 401 }
      )
    }

    // Verify password (supports legacy SHA-256 hashes too — see auth.ts)
    const { ok, needsRehash } = await verifyPassword(password, user.password)
    if (!ok) {
      return NextResponse.json(
        { error: 'Neplatný email alebo heslo' },
        { status: 401 }
      )
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Účet je deaktivovaný' },
        { status: 403 }
      )
    }

    // Transparently upgrade legacy SHA-256 hashes to bcrypt on first
    // successful login. This lets us migrate seeded accounts without
    // forcing a password reset.
    let persistedPassword = user.password
    if (needsRehash) {
      const newHash = await hashPassword(password)
      await db.user.update({ where: { id: user.id }, data: { password: newHash } })
      persistedPassword = newHash
    }

    const token = generateToken(user.id)

    const { password: _, ...userWithoutPassword } = user
    void _ // silence "unused" — we explicitly strip it

    const response = NextResponse.json(
      { user: userWithoutPassword, token, message: 'Prihlásenie úspešné' },
      { status: 200 }
    )

    response.cookies.set('frastacan_token', token, AUTH_COOKIE_OPTIONS)

    // Successful login — clear the rate-limit counter for this IP.
    resetRateLimit(ip)
    void persistedPassword

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prihlasovaní' },
      { status: 500 }
    )
  }
}
