import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/rider/my-orders - Get orders assigned to this rider
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

    const url = new URL(request.url)
    const status = url.searchParams.get('status')

    // Build where clause
    const where: Record<string, unknown> = {
      riderId: user.id,
    }

    if (status) {
      if (status === 'active') {
        where.status = { in: ['delivering'] }
      } else if (status === 'delivered') {
        where.status = 'delivered'
      }
      // 'all' or any other value = no status filter
    }

    const orders = await db.order.findMany({
      where,
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            image: true,
            logo: true,
            address: true,
            phone: true,
            city: true,
            zone: {
              select: {
                id: true,
                name: true,
                baseFee: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        items: {
          include: {
            foodItem: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Add payment info for each order
    const ordersWithPaymentInfo = orders.map((order) => ({
      ...order,
      cashToCollect: order.paymentMethod === 'cash' ? order.total : 0,
    }))

    return NextResponse.json({ orders: ordersWithPaymentInfo }, { status: 200 })
  } catch (error) {
    console.error('Get rider orders error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní objednávok kuriera' },
      { status: 500 }
    )
  }
}
