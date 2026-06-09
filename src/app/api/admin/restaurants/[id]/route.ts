import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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
    const body = await request.json()
    const { isActive, isAvailable } = body

    // At least one field must be provided
    if (isActive === undefined && isAvailable === undefined) {
      return NextResponse.json(
        { error: 'Je potrebné zadať aspoň jedno pole: isActive alebo isAvailable' },
        { status: 400 }
      )
    }

    // Validate types
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive musí byť boolean hodnota' },
        { status: 400 }
      )
    }
    if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
      return NextResponse.json(
        { error: 'isAvailable musí byť boolean hodnota' },
        { status: 400 }
      )
    }

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
