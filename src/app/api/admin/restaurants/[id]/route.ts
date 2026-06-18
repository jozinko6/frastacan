import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, adminRestaurantPatchSchema } from '@/lib/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const { id } = await params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(adminRestaurantPatchSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { isActive, isAvailable } = validation.value

    // Check restaurant exists
    const existing = await db.restaurant.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }

    const updateData: { isActive?: boolean; isAvailable?: boolean } = {}
    if (isActive !== undefined) updateData.isActive = isActive
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable

    const restaurant = await db.restaurant.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        zone: {
          select: { id: true, name: true, type: true },
        },
        categories: {
          include: {
            _count: { select: { foodItems: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            foodItems: true,
            orders: true,
            reviews: true,
            favorites: true,
          },
        },
      },
    })

    return NextResponse.json({ restaurant }, { status: 200 })
  } catch (error) {
    console.error('Update restaurant error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii reštaurácie' },
      { status: 500 }
    )
  }
}
