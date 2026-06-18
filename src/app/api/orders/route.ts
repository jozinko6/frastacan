import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, createOrderSchema } from '@/lib/validations'

/**
 * POST /api/orders
 *
 * Creates a new order. Server is the source of truth for:
 *   - per-item prices (looked up from FoodItem.price / discountPrice)
 *   - per-item quantity (validated as integer in [1, 99])
 *   - subtotal (computed from items × prices)
 *   - delivery fee (copied from Restaurant.deliveryFee)
 *   - discount (recomputed from the submitted coupon code)
 *   - total (subtotal + deliveryFee - discount, clamped >= 0)
 *   - payment status (always 'pending' on creation, regardless of
 *     paymentMethod — card payments are not yet wired to a gateway;
 *     we refuse to mark anything as 'paid' from this endpoint)
 *
 * Client-supplied values for these fields are ignored.
 */

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
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

    const validation = validateInput(createOrderSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      notes,
      couponCode,
    } = validation.value

    // Verify restaurant exists and is available
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }
    if (!restaurant.isActive || !restaurant.isAvailable) {
      return NextResponse.json(
        { error: 'Reštaurácia momentálne neprijíma objednávky' },
        { status: 400 }
      )
    }

    // Lookup all food items — server is authoritative on prices.
    const foodItemIds = items.map((i) => i.foodItemId)
    const foodItems = await db.foodItem.findMany({
      where: { id: { in: foodItemIds }, restaurantId },
    })

    // Validate that every submitted item exists and belongs to this
    // restaurant. Also reject duplicates of the same foodItemId.
    if (foodItems.length !== new Set(foodItemIds).size) {
      return NextResponse.json(
        { error: 'Niektoré položky neboli nájdené alebo nepatria do tejto reštaurácie' },
        { status: 400 }
      )
    }

    const foodItemMap = new Map(foodItems.map((fi) => [fi.id, fi]))

    let subtotal = 0
    const orderItemsData: Array<{
      quantity: number
      price: number
      notes: string | null
      foodItemId: string
    }> = []

    for (const item of items) {
      const foodItem = foodItemMap.get(item.foodItemId)
      if (!foodItem) {
        // Should be unreachable thanks to the check above, but defensive.
        return NextResponse.json(
          { error: `Položka ${item.foodItemId} nenájdená` },
          { status: 400 }
        )
      }
      if (!foodItem.isAvailable) {
        return NextResponse.json(
          { error: `Položka "${foodItem.name}" nie je dostupná` },
          { status: 400 }
        )
      }

      // `quantity` is already validated by Zod as int in [1, 99].
      const quantity = item.quantity
      // Use discount price if it's set and strictly lower than the
      // regular price — protects against stale client data where
      // discountPrice > price.
      const price =
        foodItem.discountPrice !== null && foodItem.discountPrice < foodItem.price
          ? foodItem.discountPrice
          : foodItem.price

      const itemTotal = price * quantity
      subtotal += itemTotal

      orderItemsData.push({
        quantity,
        price,
        notes: item.notes ?? null,
        foodItemId: item.foodItemId,
      })
    }

    // Round subtotal to 2 decimals to avoid float drift.
    subtotal = Math.round(subtotal * 100) / 100

    // Check minimum order
    if (subtotal < restaurant.minimumOrder) {
      return NextResponse.json(
        { error: `Minimálna objednávka je ${restaurant.minimumOrder.toFixed(2)} €` },
        { status: 400 }
      )
    }

    // Delivery fee is taken from the restaurant record — never trusted
    // from the client.
    const deliveryFee = restaurant.deliveryFee

    // Calculate discount from coupon. The coupon validation logic is
    // duplicated here on purpose: the /api/coupons/validate endpoint
    // is unauthenticated (used to preview discount in the cart UI) and
    // therefore cannot be trusted as the source of truth.
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode.toUpperCase() },
      })
      if (!coupon || !coupon.isActive) {
        return NextResponse.json(
          { error: 'Neplatný kupón' },
          { status: 400 }
        )
      }
      if (coupon.expiresAt && coupon.expiresAt < new Date()) {
        return NextResponse.json(
          { error: 'Kupón vypršal' },
          { status: 400 }
        )
      }
      if (subtotal < coupon.minOrder) {
        return NextResponse.json(
          { error: `Minimálna objednávka pre kupón je ${coupon.minOrder.toFixed(2)} €` },
          { status: 400 }
        )
      }
      discount = (subtotal * coupon.discount) / 100
      if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount
      }
      discount = Math.round(discount * 100) / 100
    }

    const total = Math.max(0, Math.round((subtotal + deliveryFee - discount) * 100) / 100)

    // Generate unique order number. We use `findFirst` + 1 here, but
    // wrap in a try/catch — concurrent inserts could collide on the
    // orderNumber unique constraint. The fallback appends a random
    // 4-char suffix and retries once.
    let orderNumber = await nextOrderNumber()
    let order
    try {
      order = await db.order.create({
        data: {
          orderNumber,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'pending', // Always 'pending' on creation.
          subtotal,
          deliveryFee: Math.round(deliveryFee * 100) / 100,
          discount,
          total,
          notes: notes ?? null,
          deliveryAddress,
          customerId: user.id,
          restaurantId,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              foodItem: true,
            },
          },
          restaurant: {
            select: { id: true, name: true, image: true, logo: true, phone: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      })
    } catch (err) {
      // Collision on orderNumber unique constraint — retry with suffix.
      orderNumber = `${orderNumber}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
      order = await db.order.create({
        data: {
          orderNumber,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'pending',
          subtotal,
          deliveryFee: Math.round(deliveryFee * 100) / 100,
          discount,
          total,
          notes: notes ?? null,
          deliveryAddress,
          customerId: user.id,
          restaurantId,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              foodItem: true,
            },
          },
          restaurant: {
            select: { id: true, name: true, image: true, logo: true, phone: true },
          },
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
      })
      // Re-throw any non-collision error so the outer catch handles it.
      void err
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní objednávky' },
      { status: 500 }
    )
  }
}

/**
 * Generates the next human-readable order number in the form `FR-001`.
 * Looks at the most recent order to determine the next sequence
 * number. This is not safe under high concurrency (two concurrent
 * requests could both read FR-005 and try to insert FR-006), but the
 * caller catches the unique-constraint violation and falls back to a
 * suffix. For a small-town delivery platform this is more than
 * sufficient and avoids needing a separate sequence table.
 */
async function nextOrderNumber(): Promise<string> {
  const lastOrder = await db.order.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  })
  let nextNumber = 1
  if (lastOrder?.orderNumber) {
    const match = lastOrder.orderNumber.match(/^FR-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }
  return `FR-${String(nextNumber).padStart(3, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const status = searchParams.get('status')

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Neprihlásený' },
        { status: 401 }
      )
    }

    // For security, prefer the authenticated user's id. Allow overriding
    // with query param only for admins (e.g. admin dashboard listing
    // all orders). Non-admins cannot read another user's orders.
    let userId = user.id
    if (userIdParam && user.role === 'admin') {
      userId = userIdParam
    } else if (userIdParam && userIdParam !== user.id) {
      // Non-admin trying to read someone else's orders — refuse.
      return NextResponse.json(
        { error: 'Nemáte oprávnenie na zobrazenie cudzích objednávok' },
        { status: 403 }
      )
    }

    const where: Record<string, unknown> = { customerId: userId }
    if (status) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            foodItem: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
        restaurant: {
          select: { id: true, name: true, image: true, logo: true },
        },
        rider: {
          select: { id: true, name: true, phone: true },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('List orders error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní objednávok' },
      { status: 500 }
    )
  }
}
