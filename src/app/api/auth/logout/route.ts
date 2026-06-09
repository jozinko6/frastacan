import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth'

export async function POST() {
  const response = NextResponse.json(
    { message: 'Úspešne odhlásený' },
    { status: 200 }
  )
  return clearAuthCookie(response)
}

export async function GET() {
  const response = NextResponse.json(
    { message: 'Úspešne odhlásený' },
    { status: 200 }
  )
  return clearAuthCookie(response)
}
