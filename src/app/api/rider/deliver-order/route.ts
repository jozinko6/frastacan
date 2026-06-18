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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }
    const { orderId } = body as { orderId?: unknown }
    if (typeof orderId !== 'string' || orderId.length === 0) {
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

    // Verify order is currently in 'delivering' or 'picking_up' status.
    // Allowing 'picking_up' → 'delivered' is a small UX shortcut: if a
    // rider picks up and immediately delivers (e.g. takeaway around the
    // corner) they don't have to flip through 'delivering' first.
    if (!['delivering', 'picking_up'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Objednávka nie je v stave doručovania' },
        { status: 400 }
      )
    }

    // Use a transaction to update order and rider profile atomically.
    // The order update includes a WHERE clause that requires the
    // current status to still be picking_up/delivering — this prevents
    // double-delivery if the rider fires the request twice.
    try {
      const updateResult = await db.$transaction(async (tx) => {
        // Conditional update — only succeeds if status is still in the
        // active delivery set. Returns { count } so we can detect races.
        const result = await tx.order.updateMany({
          where: { id: orderId, status: { in: ['delivering', 'picking_up'] } },
          data: {
            status: 'delivered',
            deliveredAt: new Date(),
            // Mark cash payments as paid on delivery.
            ...(order.paymentMethod === 'cash' && order.paymentStatus === 'pending'
              ? { paymentStatus: 'paid' }
              : {}),
          },
        })

        if (result.count === 0) {
          // Status changed under us — abort the transaction.
          throw new Error('ORDER_NOT_DELIVERABLE')
        }

        // Update rider's stats: increment totalDeliveries, add deliveryFee
        // to earnings and wallet. Inside the same transaction so the
        // stats stay consistent with the order state.
        const profile = await tx.riderProfile.update({
          where: { userId: user.id },
          data: {
            totalDeliveries: { increment: 1 },
            totalEarnings: { increment: order.deliveryFee },
            walletBalance: { increment: order.deliveryFee },
          },
        })

        // Re-fetch the full order for the response.
        const fullOrder = await tx.order.findUnique({
          where: { id: orderId },
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
                city: true,
              },
            },
            customer: {
              select: { id: true, name: true, phone: true },
            },
          },
        })

        return { fullOrder, profile }
      })

      return NextResponse.json(
        {
          order: updateResult.fullOrder,
          profile: updateResult.profile,
        },
        { status: 200 }
      )
    } catch (txErr) {
      if (txErr instanceof Error && txErr.message === 'ORDER_NOT_DELIVERABLE') {
        return NextResponse.json(
          { error: 'Objednávku už nie je možné označiť ako doručenú' },
          { status: 409 }
        )
      }
      console.error('Deliver order transaction failed:', txErr)
      return NextResponse.json(
        { error: 'Chyba pri označovaní objednávky ako doručenej' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Deliver order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri označovaní objednávky ako doručenej' },
      { status: 500 }
    )
  }
}
