import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, generateToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Neprihlásený' },
        { status: 401 }
      )
    }

    // Generate a fresh token so the client can store it for authFetch
    const token = generateToken(user.id)

    // Also set the cookie to keep it fresh
    const response = NextResponse.json({ user, token }, { status: 200 })
    response.cookies.set('frastacan_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní používateľa' },
      { status: 500 }
    )
  }
}
