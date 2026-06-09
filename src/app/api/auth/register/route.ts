import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password, phone } = body

    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, meno a heslo sú povinné' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Používateľ s týmto emailom už existuje' },
        { status: 409 }
      )
    }

    // Create user
    const hashedPassword = hashPassword(password)
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
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Chyba pri registrácii' },
      { status: 500 }
    )
  }
}
