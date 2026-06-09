import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

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

    const body = await request.json()
    const {
      name,
      description,
      phone,
      email,
      address,
      city,
      openingHours,
      deliveryType,
      cuisine,
      minimumOrder,
      deliveryFee,
      isAvailable,
    } = body

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (typeof name === 'string') updateData.name = name
    if (typeof description === 'string') updateData.description = description
    if (typeof phone === 'string') updateData.phone = phone || null
    if (typeof email === 'string') updateData.email = email || null
    if (typeof address === 'string') updateData.address = address
    if (typeof city === 'string') updateData.city = city
    if (typeof openingHours === 'string') updateData.openingHours = openingHours || null
    if (typeof deliveryType === 'string') updateData.deliveryType = deliveryType
    if (typeof cuisine === 'string') updateData.cuisine = cuisine
    if (typeof minimumOrder === 'number') updateData.minimumOrder = minimumOrder
    if (typeof deliveryFee === 'number') updateData.deliveryFee = deliveryFee
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Žiadne údaje na aktualizáciu' },
        { status: 400 }
      )
    }

    // Update slug if name changed
    if (name && name !== restaurant.name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9áäčďéíĺľňóôŕšťúýž]+/g, '-')
        .replace(/^-|-$/g, '')
      updateData.slug = slug
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
