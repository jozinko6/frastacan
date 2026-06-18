import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, createAddressSchema } from '@/lib/validations'

/**
 * GET /api/addresses
 *
 * Returns all delivery addresses that belong to the authenticated user.
 *
 * SECURITY: The previous implementation accepted a `userId` query param
 * and silently used it (`?userId=...`). That allowed any logged-in user
 * to read any other user's addresses by simply enumerating IDs (IDOR).
 * We now ignore the query param entirely — the server always uses the
 * authenticated user's id.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const addresses = await db.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ addresses }, { status: 200 })
  } catch (error) {
    console.error('List addresses error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní adries' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/addresses
 *
 * Creates a new delivery address for the authenticated user.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
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

    const validation = validateInput(createAddressSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { label, street, city, postalCode, lat, lng, isDefault } = validation.value

    // If this is set as default, unset others — only one default per user.
    if (isDefault) {
      await db.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      })
    }

    const address = await db.address.create({
      data: {
        label,
        street,
        city,
        postalCode: postalCode || null,
        lat: lat ?? null,
        lng: lng ?? null,
        isDefault: isDefault || false,
        userId: user.id,
      },
    })

    return NextResponse.json({ address }, { status: 201 })
  } catch (error) {
    console.error('Create address error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní adresy' },
      { status: 500 }
    )
  }
}
