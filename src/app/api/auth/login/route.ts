import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email a heslo sú povinné' },
        { status: 400 }
      )
    }

    // Find user
    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json(
        { error: 'Neplatný email alebo heslo' },
        { status: 401 }
      )
    }

    // Verify password
    if (!verifyPassword(password, user.password)) {
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

    const token = generateToken(user.id)

    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json(
      { user: userWithoutPassword, token, message: 'Prihlásenie úspešné' },
      { status: 200 }
    )

    // Set cookie
    response.cookies.set('frastacan_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prihlasovaní' },
      { status: 500 }
    )
  }
}
