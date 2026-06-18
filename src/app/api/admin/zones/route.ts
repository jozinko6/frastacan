import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, adminZonePatchSchema } from '@/lib/validations'

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(adminZonePatchSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      zoneId,
      name,
      type,
      baseFee,
      minimumOrder,
      estimatedMin,
      estimatedMax,
      radiusKm,
      isActive,
    } = validation.value

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
    if (baseFee !== undefined) updateData.baseFee = baseFee
    if (minimumOrder !== undefined) updateData.minimumOrder = minimumOrder
    if (estimatedMin !== undefined) updateData.estimatedMin = estimatedMin
    if (estimatedMax !== undefined) updateData.estimatedMax = estimatedMax
    if (radiusKm !== undefined) updateData.radiusKm = radiusKm
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
