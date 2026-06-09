import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/rider/available-orders - List orders ready for delivery
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

    // Find orders with status 'ready' and no rider assigned yet
    const availableOrders = await db.order.findMany({
      where: {
        status: 'ready',
        riderId: null,
      },
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
      orderBy: { createdAt: 'asc' },
    })

    // Add payment info for each order
    const ordersWithPaymentInfo = availableOrders.map((order) => ({
      ...order,
      cashToCollect: order.paymentMethod === 'cash' ? order.total : 0,
    }))

    return NextResponse.json({ orders: ordersWithPaymentInfo }, { status: 200 })
  } catch (error) {
    console.error('Get available orders error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní dostupných objednávok' },
      { status: 500 }
    )
  }
}
