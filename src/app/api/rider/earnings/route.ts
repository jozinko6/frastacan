import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/rider/earnings - Get rider earnings data
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

    // Last 7 days earnings - fetch delivered orders by this rider
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    const recentDeliveries = await db.order.findMany({
      where: {
        riderId: user.id,
        status: 'delivered',
        deliveredAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        orderNumber: true,
        deliveryFee: true,
        total: true,
        paymentMethod: true,
        deliveredAt: true,
        restaurant: {
          select: { id: true, name: true, logo: true },
        },
      },
      orderBy: { deliveredAt: 'desc' },
    })

    // Group earnings by day (last 7 days)
    const earningsByDay: Record<string, number> = {}
    const deliveryCountByDay: Record<string, number> = {}

    // Initialize all 7 days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toISOString().split('T')[0]
      earningsByDay[dayKey] = 0
      deliveryCountByDay[dayKey] = 0
    }

    // Fill in actual data
    for (const delivery of recentDeliveries) {
      if (delivery.deliveredAt) {
        const dayKey = delivery.deliveredAt.toISOString().split('T')[0]
        if (earningsByDay[dayKey] !== undefined) {
          earningsByDay[dayKey] += delivery.deliveryFee
          deliveryCountByDay[dayKey] += 1
        }
      }
    }

    // Round earnings by day
    for (const key of Object.keys(earningsByDay)) {
      earningsByDay[key] = Math.round(earningsByDay[key] * 100) / 100
    }

    return NextResponse.json(
      {
        totalEarnings: riderProfile.totalEarnings,
        walletBalance: riderProfile.walletBalance,
        totalDeliveries: riderProfile.totalDeliveries,
        rating: riderProfile.rating,
        reviewCount: riderProfile.reviewCount,
        earningsByDay,
        deliveryCountByDay,
        recentDeliveries,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get rider earnings error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní zárobkov kuriera' },
      { status: 500 }
    )
  }
}
