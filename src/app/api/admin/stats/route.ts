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

    // Total counts
    const [totalOrders, totalUsers, totalRestaurants, totalFoodItems] = await Promise.all([
      db.order.count(),
      db.user.count({ where: { role: 'customer' } }),
      db.restaurant.count(),
      db.foodItem.count(),
    ])

    // Total revenue (from delivered/paid orders)
    const revenueResult = await db.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: ['delivered'] },
        paymentStatus: { in: ['paid'] },
      },
    })
    const totalRevenue = revenueResult._sum.total || 0

    // Orders by status
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const ordersByStatusMap = ordersByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status
      return acc
    }, {} as Record<string, number>)

    // Recent orders (last 10)
    const recentOrders = await db.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        restaurant: {
          select: { id: true, name: true, logo: true },
        },
        items: {
          include: {
            foodItem: {
              select: { name: true, price: true },
            },
          },
        },
      },
    })

    // Revenue by day (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentRevenueOrders = await db.order.findMany({
      where: {
        status: 'delivered',
        createdAt: { gte: sevenDaysAgo },
      },
      select: { total: true, createdAt: true },
    })

    // Group revenue by day
    const revenueByDay: Record<string, number> = {}
    for (const order of recentRevenueOrders) {
      const day = order.createdAt.toISOString().split('T')[0]
      revenueByDay[day] = (revenueByDay[day] || 0) + order.total
    }

    // Top restaurants by orders
    const topRestaurants = await db.restaurant.findMany({
      take: 5,
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json({
      stats: {
        totalOrders,
        totalRevenue,
        totalUsers,
        totalRestaurants,
        totalFoodItems,
        ordersByStatus: ordersByStatusMap,
        revenueByDay,
      },
      recentOrders,
      topRestaurants,
    }, { status: 200 })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní štatistík' },
      { status: 500 }
    )
  }
}
