import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'
import { registerSchema, validateInput } from '@/lib/validations'

// In-memory per-IP rate limiter for registrations. Lower cap than login
// because registration is a less-frequent operation. 5 per hour per IP.
const REGISTER_WINDOW_MS = 60 * 60 * 1000
const REGISTER_MAX_ATTEMPTS = 5
const registerAttempts = new Map<string, { count: number; firstAt: number }>()

function rateLimit(ip: string): { ok: boolean; retryAfterMs: number } {
  const now = Date.now()
  const entry = registerAttempts.get(ip)
  if (!entry || now - entry.firstAt > REGISTER_WINDOW_MS) {
    registerAttempts.set(ip, { count: 1, firstAt: now })
    return { ok: true, retryAfterMs: 0 }
  }
  entry.count += 1
  if (entry.count > REGISTER_MAX_ATTEMPTS) {
    return { ok: false, retryAfterMs: REGISTER_WINDOW_MS - (now - entry.firstAt) }
  }
  return { ok: true, retryAfterMs: 0 }
}

function getClientIp(request: NextRequest): string {
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
        { error: 'Príliš veľa pokusov o registráciu. Skúste to neskôr.' },
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

    const validation = validateInput(registerSchema, body)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    const { email, name, password, phone } = validation.value

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      // Use a non-enumerable message: an attacker shouldn't be able to
      // list which emails are already registered.
      return NextResponse.json(
        { error: 'Registrácia zlyhala. Skúste iný email.' },
        { status: 409 }
      )
    }

    // Create user with bcrypt-hashed password
    const hashedPassword = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        phone: phone || null,
        role: 'customer',
      },
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

    const token = generateToken(user.id)

    const response = NextResponse.json(
      { user, token, message: 'Registrácia úspešná' },
      { status: 201 }
    )

    response.cookies.set('frastacan_token', token, AUTH_COOKIE_OPTIONS)
    return response
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Chyba pri registrácii' },
      { status: 500 }
    )
  }
}
