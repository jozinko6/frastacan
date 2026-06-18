import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, vendorPatchSchema } from '@/lib/validations'

// GET /api/vendor - Get current vendor's restaurant info and stats
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }
    if (user.role !== 'restaurant') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa rola prevádzkovateľa.' },
        { status: 403 }
      )
    }

    const restaurant = await db.restaurant.findUnique({
      where: { ownerId: user.id },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Prevádzka nenájdená' },
        { status: 404 }
      )
    }

    // Today's orders
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysOrders = await db.order.count({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: today },
        status: { notIn: ['cancelled'] },
      },
    })

    // Today's revenue
    const todaysRevenueResult = await db.order.aggregate({
      where: {
        restaurantId: restaurant.id,
        createdAt: { gte: today },
        status: { notIn: ['cancelled'] },
      },
      _sum: { total: true },
    })
    const todaysRevenue = todaysRevenueResult._sum.total || 0

    // Pending orders
    const pendingOrders = await db.order.count({
      where: {
        restaurantId: restaurant.id,
        status: 'pending',
      },
    })

    // Active menu items
    const activeMenuItems = await db.foodItem.count({
      where: {
        restaurantId: restaurant.id,
        isAvailable: true,
      },
    })

    return NextResponse.json(
      {
        restaurant,
        todaysOrders,
        todaysRevenue: Math.round(todaysRevenue * 100) / 100,
        pendingOrders,
        activeMenuItems,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get vendor info error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní prevádzky' },
      { status: 500 }
    )
  }
}

// PATCH /api/vendor - Update restaurant details
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }
    if (user.role !== 'restaurant') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa rola prevádzkovateľa.' },
        { status: 403 }
      )
    }

    const restaurant = await db.restaurant.findUnique({
      where: { ownerId: user.id },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Prevádzka nenájdená' },
        { status: 404 }
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

    const validation = validateInput(vendorPatchSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const v = validation.value

    // Build update data — Zod schema already validated types and bounds
    // for each field, so we can copy them straight in.
    const updateData: Record<string, unknown> = {}
    if (v.name !== undefined) updateData.name = v.name
    if (v.description !== undefined) updateData.description = v.description
    if (v.phone !== undefined) updateData.phone = v.phone || null
    if (v.email !== undefined) updateData.email = v.email || null
    if (v.address !== undefined) updateData.address = v.address
    if (v.city !== undefined) updateData.city = v.city
    if (v.openingHours !== undefined) updateData.openingHours = v.openingHours || null
    if (v.deliveryType !== undefined) updateData.deliveryType = v.deliveryType
    if (v.cuisine !== undefined) updateData.cuisine = v.cuisine
    if (v.minimumOrder !== undefined) updateData.minimumOrder = v.minimumOrder
    if (v.deliveryFee !== undefined) updateData.deliveryFee = v.deliveryFee
    if (v.isAvailable !== undefined) updateData.isAvailable = v.isAvailable

    // Update slug if name changed - ensure uniqueness
    if (v.name && v.name !== restaurant.name) {
      let baseSlug = v.name
        .toLowerCase()
        .replace(/[^a-z0-9áäčďéíĺľňóôŕšťúýž]+/g, '-')
        .replace(/^-|-$/g, '')
      const existing = await db.restaurant.findFirst({
        where: { slug: baseSlug, NOT: { id: restaurant.id } },
        select: { slug: true },
      })
      if (existing) {
        baseSlug = `${baseSlug}-${restaurant.id.slice(-4)}`
      }
      updateData.slug = baseSlug
    }

    const updatedRestaurant = await db.restaurant.update({
      where: { id: restaurant.id },
      data: updateData,
    })

    return NextResponse.json(
      { restaurant: updatedRestaurant },
      { status: 200 }
    )
  } catch (error) {
    console.error('Update vendor error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii prevádzky' },
      { status: 500 }
    )
  }
}
