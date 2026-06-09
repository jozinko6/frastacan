import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    const addresses = await db.address.findMany({
      where: { userId },
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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const body = await request.json()
    const { label, street, city, postalCode, lat, lng, isDefault } = body

    if (!label || !street || !city) {
      return NextResponse.json(
        { error: 'Označenie, ulica a mesto sú povinné' },
        { status: 400 }
      )
    }

    // If this is set as default, unset others
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
        lat: lat || null,
        lng: lng || null,
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
