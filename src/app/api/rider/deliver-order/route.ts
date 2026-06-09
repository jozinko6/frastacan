import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// POST /api/rider/deliver-order - Rider marks order as delivered
export async function POST(request: NextRequest) {
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
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Chýba ID objednávky' },
        { status: 400 }
      )
    }

    // Find the order
    const order = await db.order.findUnique({
      where: { id: orderId },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }

    // Verify this rider is the one assigned to the order
    if (order.riderId !== user.id) {
      return NextResponse.json(
        { error: 'Nie ste priradený k tejto objednávke' },
        { status: 403 }
      )
    }

    // Verify order is currently in 'delivering' status
    if (order.status !== 'delivering') {
      return NextResponse.json(
        { error: 'Objednávka nie je v stave doručovania' },
        { status: 400 }
      )
    }

    // Use a transaction to update order and rider profile atomically
    const [updatedOrder, updatedProfile] = await db.$transaction([
      // Update order status to 'delivered' and set deliveredAt
      db.order.update({
        where: { id: orderId },
        data: {
          status: 'delivered',
          deliveredAt: new Date(),
        },
        include: {
          items: {
            include: {
              foodItem: {
                select: { id: true, name: true, image: true, price: true },
              },
            },
          },
          restaurant: {
            select: {
              id: true,
              name: true,
              image: true,
              logo: true,
              address: true,
              phone: true,
            },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      }),
      // Update rider's stats: increment totalDeliveries, add deliveryFee to earnings and wallet
      db.riderProfile.update({
        where: { userId: user.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: order.deliveryFee },
          walletBalance: { increment: order.deliveryFee },
        },
      }),
    ])

    return NextResponse.json(
      {
        order: updatedOrder,
        profile: updatedProfile,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Deliver order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri označovaní objednávky ako doručenej' },
      { status: 500 }
    )
  }
}
