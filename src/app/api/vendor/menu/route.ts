import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

// GET /api/vendor/menu - Get all categories and food items for the restaurant
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

    const restaurant = await db.restaurant.findFirst({
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
      include: {
        foodItems: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Get vendor menu error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní menu' },
      { status: 500 }
    )
  }
}

// POST /api/vendor/menu - Create new food item
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

    const restaurant = await db.restaurant.findFirst({
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
    const { name, description, price, discountPrice, isAvailable, isPopular, categoryId } = body

    if (!name || !price || !categoryId) {
      return NextResponse.json(
        { error: 'Názov, cena a kategória sú povinné' },
        { status: 400 }
      )
    }

    // Verify the category belongs to this restaurant
    const category = await db.category.findUnique({
      where: { id: categoryId },
    })
    if (!category || category.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Kategória nenájdená' },
        { status: 404 }
      )
    }

    const foodItem = await db.foodItem.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
        isPopular: typeof isPopular === 'boolean' ? isPopular : false,
        categoryId,
        restaurantId: restaurant.id,
      },
    })

    return NextResponse.json({ foodItem }, { status: 201 })
  } catch (error) {
    console.error('Create food item error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní položky' },
      { status: 500 }
    )
  }
}

// PATCH /api/vendor/menu - Update food item
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

    const restaurant = await db.restaurant.findFirst({
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
    const { id, name, description, price, discountPrice, isAvailable, isPopular, categoryId } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID položky je povinné' },
        { status: 400 }
      )
    }

    // Verify the food item belongs to this restaurant
    const existingItem = await db.foodItem.findUnique({
      where: { id },
    })
    if (!existingItem || existingItem.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Položka nenájdená' },
        { status: 404 }
      )
    }

    // If categoryId is being changed, verify it belongs to this restaurant
    if (categoryId && categoryId !== existingItem.categoryId) {
      const category = await db.category.findUnique({
        where: { id: categoryId },
      })
      if (!category || category.restaurantId !== restaurant.id) {
        return NextResponse.json(
          { error: 'Kategória nenájdená' },
          { status: 404 }
        )
      }
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (typeof name === 'string') updateData.name = name.trim()
    if (typeof description === 'string') updateData.description = description.trim() || null
    if (typeof price === 'number' || typeof price === 'string') updateData.price = parseFloat(String(price))
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice ? parseFloat(String(discountPrice)) : null
    if (typeof isAvailable === 'boolean') updateData.isAvailable = isAvailable
    if (typeof isPopular === 'boolean') updateData.isPopular = isPopular
    if (typeof categoryId === 'string') updateData.categoryId = categoryId

    const foodItem = await db.foodItem.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ foodItem }, { status: 200 })
  } catch (error) {
    console.error('Update food item error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii položky' },
      { status: 500 }
    )
  }
}

// DELETE /api/vendor/menu - Delete food item
export async function DELETE(request: NextRequest) {
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

    const restaurant = await db.restaurant.findFirst({
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
    const { id } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID položky je povinné' },
        { status: 400 }
      )
    }

    // Verify the food item belongs to this restaurant
    const existingItem = await db.foodItem.findUnique({
      where: { id },
    })
    if (!existingItem || existingItem.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Položka nenájdená' },
        { status: 404 }
      )
    }

    await db.foodItem.delete({
      where: { id },
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete food item error:', error)
    return NextResponse.json(
      { error: 'Chyba pri odstraňovaní položky' },
      { status: 500 }
    )
  }
}
