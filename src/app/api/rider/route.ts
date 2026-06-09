import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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
        status: { in: ['delivering'] },
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

// PATCH /api/rider - Update rider availability and location
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

    const body = await request.json()
    const { isAvailable, currentLat, currentLng } = body

    // Ensure rider profile exists
    let riderProfile = await db.riderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!riderProfile) {
      riderProfile = await db.riderProfile.create({
        data: { userId: user.id },
      })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (typeof isAvailable === 'boolean') {
      updateData.isAvailable = isAvailable
    }
    if (typeof currentLat === 'number') {
      updateData.currentLat = currentLat
    }
    if (typeof currentLng === 'number') {
      updateData.currentLng = currentLng
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Žiadne údaje na aktualizáciu' },
        { status: 400 }
      )
    }

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
