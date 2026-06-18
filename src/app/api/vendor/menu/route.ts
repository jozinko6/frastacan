import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import {
  validateInput,
  vendorMenuCreateSchema,
  vendorMenuPatchSchema,
} from '@/lib/validations'

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(vendorMenuCreateSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { name, description, price, discountPrice, isAvailable, isPopular, categoryId } = validation.value

    // Verify the category belongs to this restaurant (prevents vendor
    // from creating items under another vendor's category).
    const category = await db.category.findUnique({
      where: { id: categoryId },
      select: { id: true, restaurantId: true },
    })
    if (!category || category.restaurantId !== restaurant.id) {
      return NextResponse.json(
        { error: 'Kategória nenájdená' },
        { status: 404 }
      )
    }

    // Defensive: discountPrice must be strictly lower than price.
    if (discountPrice !== null && discountPrice !== undefined && discountPrice >= price) {
      return NextResponse.json(
        { error: 'Akciová cena musí byť nižšia ako bežná cena' },
        { status: 400 }
      )
    }

    const foodItem = await db.foodItem.create({
      data: {
        name,
        description: description ?? null,
        price,
        discountPrice: discountPrice ?? null,
        isAvailable: isAvailable ?? true,
        isPopular: isPopular ?? false,
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(vendorMenuPatchSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const {
      id,
      name,
      description,
      price,
      discountPrice,
      isAvailable,
      isPopular,
      categoryId,
    } = validation.value

    // Verify the food item belongs to this restaurant
    const existingItem = await db.foodItem.findUnique({
      where: { id },
      select: { id: true, restaurantId: true, categoryId: true, price: true },
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
        select: { id: true, restaurantId: true },
      })
      if (!category || category.restaurantId !== restaurant.id) {
        return NextResponse.json(
          { error: 'Kategória nenájdená' },
          { status: 404 }
        )
      }
    }

    // Defensive: discountPrice must be strictly lower than the
    // (new or existing) price.
    const effectivePrice = price ?? existingItem.price
    if (discountPrice !== undefined && discountPrice !== null && discountPrice >= effectivePrice) {
      return NextResponse.json(
        { error: 'Akciová cena musí byť nižšia ako bežná cena' },
        { status: 400 }
      )
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description || null
    if (price !== undefined) updateData.price = price
    if (discountPrice !== undefined) updateData.discountPrice = discountPrice ?? null
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable
    if (isPopular !== undefined) updateData.isPopular = isPopular
    if (categoryId !== undefined) updateData.categoryId = categoryId

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }
    const { id } = body as { id?: unknown }
    if (typeof id !== 'string' || id.length === 0) {
      return NextResponse.json(
        { error: 'ID položky je povinné' },
        { status: 400 }
      )
    }

    // Verify the food item belongs to this restaurant
    const existingItem = await db.foodItem.findUnique({
      where: { id },
      select: { id: true, restaurantId: true },
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
