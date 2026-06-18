import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest, generateToken, AUTH_COOKIE_OPTIONS } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json(
        { error: 'Neprihlásený' },
        { status: 401 }
      )
    }

    // Generate a fresh token so the client can store it for authFetch.
    // This is also the sliding-session mechanism: every call to /me
    // extends the session by 7 days from now.
    let token: string
    try {
      token = generateToken(user.id)
    } catch {
      // TOKEN_SECRET missing — refuse to issue tokens but still return
      // the authenticated user so the UI doesn't blank out for an
      // already-authenticated request.
      return NextResponse.json({ user }, { status: 200 })
    }

    const response = NextResponse.json({ user, token }, { status: 200 })
    response.cookies.set('frastacan_token', token, AUTH_COOKIE_OPTIONS)

    return response
  } catch (error) {
    console.error('Get me error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní používateľa' },
      { status: 500 }
    )
  }
}
