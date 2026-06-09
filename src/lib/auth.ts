import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

export function generateToken(userId: string): string {
  // Simple base64 encoded token with userId and timestamp
  const payload = JSON.stringify({ userId, ts: Date.now() })
  return Buffer.from(payload).toString('base64')
}

export function verifyToken(token: string): { userId: string; ts: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (payload.userId && payload.ts) {
      return payload
    }
    return null
  } catch {
    return null
  }
}

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get('frastacan_token')?.value
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

  return user
}
