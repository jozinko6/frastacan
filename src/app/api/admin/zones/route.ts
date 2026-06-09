import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const zones = await db.deliveryZone.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { restaurants: true },
        },
      },
    })

    return NextResponse.json({ zones }, { status: 200 })
  } catch (error) {
    console.error('Admin zones error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní zón' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { zoneId, name, type, baseFee, minimumOrder, estimatedMin, estimatedMax, radiusKm, isActive } = body

    if (!zoneId) {
      return NextResponse.json(
        { error: 'Chýba zoneId' },
        { status: 400 }
      )
    }

    const existing = await db.deliveryZone.findUnique({ where: { id: zoneId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Zóna nenájdená' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (type !== undefined) updateData.type = type
    if (baseFee !== undefined) updateData.baseFee = parseFloat(baseFee)
    if (minimumOrder !== undefined) updateData.minimumOrder = parseFloat(minimumOrder)
    if (estimatedMin !== undefined) updateData.estimatedMin = parseInt(estimatedMin)
    if (estimatedMax !== undefined) updateData.estimatedMax = parseInt(estimatedMax)
    if (radiusKm !== undefined) updateData.radiusKm = parseFloat(radiusKm)
    if (isActive !== undefined) updateData.isActive = isActive

    const zone = await db.deliveryZone.update({
      where: { id: zoneId },
      data: updateData,
      include: {
        _count: {
          select: { restaurants: true },
        },
      },
    })

    return NextResponse.json({ zone }, { status: 200 })
  } catch (error) {
    console.error('Update zone error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii zóny' },
      { status: 500 }
    )
  }
}
