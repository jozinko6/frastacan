import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    // Only admin, restaurant owner, or rider can update status
    if (!['admin', 'restaurant', 'rider'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na zmenu stavu objednávky' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Neplatný stav. Povolené: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    const existingOrder = await db.order.findUnique({ where: { id } })
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }

    // Prepare update data with timestamps
    const updateData: Record<string, unknown> = { status }

    if (status === 'confirmed') {
      updateData.confirmedAt = new Date()
    } else if (status === 'preparing') {
      if (!existingOrder.confirmedAt) updateData.confirmedAt = new Date()
    } else if (status === 'ready') {
      updateData.preparedAt = new Date()
    } else if (status === 'delivered') {
      updateData.deliveredAt = new Date()
      updateData.paymentStatus = existingOrder.paymentMethod === 'cash' ? 'paid' : existingOrder.paymentStatus
    } else if (status === 'cancelled') {
      updateData.cancelledAt = new Date()
    }

    // Assign rider if status is delivering and user is a rider
    if (status === 'delivering' && user.role === 'rider') {
      updateData.riderId = user.id
    }

    const order = await db.order.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            foodItem: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
        restaurant: {
          select: { id: true, name: true, image: true, logo: true, phone: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
        rider: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii stavu objednávky' },
      { status: 500 }
    )
  }
}
