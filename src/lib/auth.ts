import { createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days in ms
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'frastacan-secret-key-2024'

export function hashPassword(password: string): string {
  // Salted hash for better security
  const salt = 'frastacan-salt'
  return createHash('sha256').update(salt + password + salt).digest('hex')
}

export function verifyPassword(password: string, storedHash: string): boolean {
  // Check with current salted hash
  const saltedHash = hashPassword(password)
  if (storedHash === saltedHash) return true

  // Fallback: check without salt (for legacy passwords seeded before salt was added)
  const unsaltedHash = createHash('sha256').update(password).digest('hex')
  if (storedHash === unsaltedHash) return true

  return false
}

export function generateToken(userId: string): string {
  const payload = { userId, ts: Date.now() }
  const json = JSON.stringify(payload)
  const signature = createHash('sha256').update(json + TOKEN_SECRET).digest('hex')
  // Format: base64(payload).signature
  return Buffer.from(json).toString('base64') + '.' + signature
}

export function verifyToken(token: string): { userId: string; ts: number } | null {
  try {
    const [payloadB64, signature] = token.split('.')
    if (!payloadB64 || !signature) return null

    const json = Buffer.from(payloadB64, 'base64').toString('utf-8')
    
    // Verify signature
    const expectedSig = createHash('sha256').update(json + TOKEN_SECRET).digest('hex')
    if (signature !== expectedSig) return null

    const payload = JSON.parse(json)
    if (!payload.userId || !payload.ts) return null

    // Check expiration
    if (Date.now() - payload.ts > TOKEN_MAX_AGE) return null

    return payload
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: NextRequest) {
  // Try Authorization header first, then fall back to cookie
  let token: string | null = null

  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
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

  return user
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
