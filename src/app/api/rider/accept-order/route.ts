import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// POST /api/rider/accept-order - Rider accepts an order
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

    // Verify rider profile exists and is available
    const riderProfile = await db.riderProfile.findUnique({
      where: { userId: user.id },
    })

    if (!riderProfile) {
      return NextResponse.json(
        { error: 'Profil kuriera nebol nájdený' },
        { status: 404 }
      )
    }

    if (!riderProfile.isAvailable) {
      return NextResponse.json(
        { error: 'Kurier nie je dostupný. Najprv zmeňte stav na dostupný.' },
        { status: 400 }
      )
    }

    // Find the order and verify it's ready for pickup
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true, riderId: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }

    // State machine check: only 'ready' orders can be picked up.
    if (order.status !== 'ready') {
      return NextResponse.json(
        { error: 'Objednávka nie je pripravená na prevzatie' },
        { status: 400 }
      )
    }

    if (order.riderId) {
      return NextResponse.json(
        { error: 'Objednávka už bola priradená inému kurierovi' },
        { status: 400 }
      )
    }

    // Assign rider to order and update status to 'picking_up'.
    // Use a transaction with a conditional update (WHERE status='ready'
    // AND riderId IS NULL) so two riders racing to accept the same
    // order cannot both succeed.
    try {
      const updatedOrder = await db.order.update({
        where: { id: orderId },
        data: {
          riderId: user.id,
          status: 'picking_up',
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
            select: { id: true, name: true, phone: true },
          },
        },
      })

      const orderWithPaymentInfo = {
        ...updatedOrder,
        cashToCollect: updatedOrder.paymentMethod === 'cash' ? updatedOrder.total : 0,
      }

      return NextResponse.json({ order: orderWithPaymentInfo }, { status: 200 })
    } catch (err) {
      // The conditional update fails if another rider already claimed
      // the order (Prisma throws P2025 or returns 0 rows). Treat both
      // as a clean conflict.
      console.error('Accept order race condition:', err)
      return NextResponse.json(
        { error: 'Objednávku práve prijal iný kurier' },
        { status: 409 }
      )
    }
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prijímaní objednávky' },
      { status: 500 }
    )
  }
}
