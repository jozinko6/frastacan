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

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
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
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }

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

    // Assign rider to order and update status to 'delivering'
    const updatedOrder = await db.order.update({
      where: { id: orderId },
      data: {
        riderId: user.id,
        status: 'delivering',
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

    // Add cash collection info
    const orderWithPaymentInfo = {
      ...updatedOrder,
      cashToCollect: updatedOrder.paymentMethod === 'cash' ? updatedOrder.total : 0,
    }

    return NextResponse.json({ order: orderWithPaymentInfo }, { status: 200 })
  } catch (error) {
    console.error('Accept order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri prijímaní objednávky' },
      { status: 500 }
    )
  }
}
