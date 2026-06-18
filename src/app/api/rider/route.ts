import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, riderPatchSchema } from '@/lib/validations'

// GET /api/rider - Get rider profile and stats
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }
    if (user.role !== 'rider') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa rola kuriera.' },
        { status: 403 }
      )
    }

    // Get or create rider profile
    let riderProfile = await db.riderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!riderProfile) {
      riderProfile = await db.riderProfile.create({
        data: { userId: user.id },
      })
    }

    // Active orders count (orders currently being delivered by this rider)
    const activeOrdersCount = await db.order.count({
      where: {
        riderId: user.id,
        status: { in: ['picking_up', 'delivering'] },
      },
    })

    // Today's earnings
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysDeliveries = await db.order.findMany({
      where: {
        riderId: user.id,
        status: 'delivered',
        deliveredAt: { gte: today },
      },
      select: { deliveryFee: true },
    })

    const todaysEarnings = todaysDeliveries.reduce(
      (sum, order) => sum + order.deliveryFee,
      0
    )

    return NextResponse.json(
      {
        profile: riderProfile,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
          role: user.role,
        },
        activeOrdersCount,
        todaysEarnings: Math.round(todaysEarnings * 100) / 100,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get rider profile error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní profilu kuriera' },
      { status: 500 }
    )
  }
}

// PATCH /api/rider - Update rider availability, location, and vehicle type
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }
    if (user.role !== 'rider') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa rola kuriera.' },
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

    const validation = validateInput(riderPatchSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { isAvailable, currentLat, currentLng, vehicleType } = validation.value

    // Ensure rider profile exists
    let riderProfile = await db.riderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!riderProfile) {
      riderProfile = await db.riderProfile.create({
        data: { userId: user.id },
      })
    }

    // Build update data — Zod already validated types and bounds.
    const updateData: Record<string, unknown> = {}
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (currentLat !== undefined) updateData.currentLat = currentLat
    if (currentLng !== undefined) updateData.currentLng = currentLng
    if (vehicleType !== undefined) updateData.vehicleType = vehicleType

    const updatedProfile = await db.riderProfile.update({
      where: { userId: user.id },
      data: updateData,
    })

    return NextResponse.json({ profile: updatedProfile }, { status: 200 })
  } catch (error) {
    console.error('Update rider profile error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii profilu kuriera' },
      { status: 500 }
    )
  }
}
