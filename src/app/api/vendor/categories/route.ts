import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/vendor/categories - Get categories for the restaurant
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
      select: { id: true },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Prevádzka nenájdená' },
        { status: 404 }
      )
    }

    const categories = await db.category.findMany({
      where: { restaurantId: restaurant.id },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Get vendor categories error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní kategórií' },
      { status: 500 }
    )
  }
}

// POST /api/vendor/categories - Create new category
export async function POST(request: NextRequest) {
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
      select: { id: true },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Prevádzka nenájdená' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, icon, sortOrder } = body

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Názov kategórie je povinný' },
        { status: 400 }
      )
    }

    // Get the max sortOrder for this restaurant's categories
    const maxSortResult = await db.category.aggregate({
      where: { restaurantId: restaurant.id },
      _max: { sortOrder: true },
    })
    const nextSortOrder = sortOrder ?? ((maxSortResult._max.sortOrder ?? -1) + 1)

    const category = await db.category.create({
      data: {
        name: name.trim(),
        icon: icon?.trim() || null,
        sortOrder: nextSortOrder,
        restaurantId: restaurant.id,
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Create category error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní kategórie' },
      { status: 500 }
    )
  }
}
