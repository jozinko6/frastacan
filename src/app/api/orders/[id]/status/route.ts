import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, orderStatusSchema } from '@/lib/validations'

/**
 * PATCH /api/orders/[id]/status
 *
 * Updates the status of an order. Authorisation is layered:
 *
 *   1. Caller must be authenticated.
 *   2. Caller's role must be admin, restaurant (vendor) or rider.
 *      Customers cannot change order status — they can only cancel
 *      their own pending order via a separate endpoint (not yet
 *      implemented; tracked in TODO).
 *   3. Restaurant callers can only update orders that belong to a
 *      restaurant they own (matched via ownerId on Restaurant).
 *   4. Rider callers can only update orders they are assigned to
 *      (order.riderId === user.id) AND only along the rider-controlled
 *      transitions: picking_up → delivering → delivered. They cannot,
 *      for example, set status to 'cancelled' or 'refunded'.
 *   5. Admin callers can perform any transition.
 *
 * The valid status graph itself is enforced server-side via the
 * `nextStatuses` map — no skipping states (e.g. 'pending' → 'delivered'
 * is rejected) regardless of who the caller is.
 */

const validStatuses = new Set([
  'pending', 'confirmed', 'preparing', 'ready',
  'picking_up', 'delivering', 'delivered',
  'cancelled', 'refunded', 'failed',
])

const nextStatuses: Record<string, Set<string>> = {
  pending:    new Set(['confirmed', 'cancelled']),
  confirmed:  new Set(['preparing', 'cancelled']),
  preparing:  new Set(['ready', 'cancelled']),
  ready:      new Set(['picking_up', 'cancelled']),
  picking_up: new Set(['delivering', 'cancelled']),
  delivering: new Set(['delivered', 'failed']),
  delivered:  new Set(['refunded']),
  cancelled:  new Set([]),
  refunded:   new Set([]),
  failed:     new Set(['refunded']),
}

// Statuses that a rider is allowed to set on an order they own.
const riderAllowedNextStatuses = new Set(['delivering', 'delivered'])

// Statuses that a restaurant (vendor) is allowed to set on their own order.
const vendorAllowedNextStatuses = new Set([
  'confirmed', 'preparing', 'ready', 'cancelled',
])

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(orderStatusSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { status: newStatus } = validation.value

    if (!validStatuses.has(newStatus)) {
      return NextResponse.json(
        { error: `Neplatný stav. Povolené: ${Array.from(validStatuses).join(', ')}` },
        { status: 400 }
      )
    }

    const existingOrder = await db.order.findUnique({
      where: { id },
      include: {
        restaurant: { select: { id: true, ownerId: true } },
      },
    })
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }

    // ── Authorisation by role ────────────────────────────────────────
    //   - admin: any order, any transition
    //   - restaurant: only orders of restaurants they own
    //   - rider:     only orders assigned to them
    if (user.role === 'restaurant') {
      if (existingOrder.restaurant.ownerId !== user.id) {
        return NextResponse.json(
          { error: 'Nemáte oprávnenie meniť stav tejto objednávky' },
          { status: 403 }
        )
      }
      if (!vendorAllowedNextStatuses.has(newStatus)) {
        return NextResponse.json(
          { error: 'Prevádzka môže nastaviť len stavy: ' + Array.from(vendorAllowedNextStatuses).join(', ') },
          { status: 403 }
        )
      }
    } else if (user.role === 'rider') {
      if (existingOrder.riderId !== user.id) {
        return NextResponse.json(
          { error: 'Nie ste priradený k tejto objednávke' },
          { status: 403 }
        )
      }
      if (!riderAllowedNextStatuses.has(newStatus)) {
        return NextResponse.json(
          { error: 'Kurier môže nastaviť len stavy: ' + Array.from(riderAllowedNextStatuses).join(', ') },
          { status: 403 }
        )
      }
    }
    // admin: no extra checks here

    // ── State machine: forbid illegal jumps ──────────────────────────
    const allowedNext = nextStatuses[existingOrder.status]
    if (!allowedNext || !allowedNext.has(newStatus)) {
      return NextResponse.json(
        {
          error: `Zmena zo stavu „${existingOrder.status}" do „${newStatus}" nie je povolená`,
        },
        { status: 400 }
      )
    }

    // ── Prepare update payload with timestamps ───────────────────────
    const updateData: Record<string, unknown> = { status: newStatus }

    if (newStatus === 'confirmed') {
      updateData.confirmedAt = new Date()
    } else if (newStatus === 'preparing') {
      if (!existingOrder.confirmedAt) updateData.confirmedAt = new Date()
    } else if (newStatus === 'ready') {
      updateData.preparedAt = new Date()
    } else if (newStatus === 'picking_up') {
      // Rider is on their way to pick up the order
      // (admin or vendor can also force this state)
      if (user.role === 'rider') {
        updateData.riderId = user.id
      }
    } else if (newStatus === 'delivering') {
      // Rider has picked up and is delivering
      if (user.role === 'rider') {
        updateData.riderId = user.id
      }
    } else if (newStatus === 'delivered') {
      updateData.deliveredAt = new Date()
      // Mark cash payments as paid on delivery
      if (existingOrder.paymentMethod === 'cash' && existingOrder.paymentStatus === 'pending') {
        updateData.paymentStatus = 'paid'
      }
    } else if (newStatus === 'cancelled') {
      updateData.cancelledAt = new Date()
    } else if (newStatus === 'refunded') {
      updateData.paymentStatus = 'failed'
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

    // Side effect: when rider marks order as delivered, update their
    // RiderProfile (totalDeliveries / totalEarnings / walletBalance).
    // This was previously in /api/rider/deliver-order but should also
    // fire here so the admin-triggered transition stays consistent.
    if (newStatus === 'delivered' && user.role === 'rider') {
      await db.riderProfile.update({
        where: { userId: user.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: existingOrder.deliveryFee },
          walletBalance: { increment: existingOrder.deliveryFee },
        },
      }).catch((err) => {
        // Don't fail the order update if profile update fails — but log it.
        console.error('[orders/[id]/status] Failed to update rider profile:', err)
      })
    }

    return NextResponse.json({ order }, { status: 200 })
  } catch (error) {
    console.error('Update order status error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii stavu objednávky' },
      { status: 500 }
    )
  }
}
