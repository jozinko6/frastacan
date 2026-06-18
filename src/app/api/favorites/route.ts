import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

/**
 * GET /api/favorites
 *
 * Lists the authenticated user's favourite restaurants.
 *
 * SECURITY: Previous implementation accepted `?userId=...` and used it
 * directly — IDOR. We now always use the authenticated user's id and
 * ignore the query param.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const favorites = await db.favorite.findMany({
      where: { userId: user.id },
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            logo: true,
            cuisine: true,
            rating: true,
            reviewCount: true,
            deliveryTime: true,
            minimumOrder: true,
            deliveryFee: true,
            isActive: true,
            isAvailable: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ favorites }, { status: 200 })
  } catch (error) {
    console.error('List favorites error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní obľúbených' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/favorites
 *
 * Toggles a restaurant in the authenticated user's favourites.
 *
 * SECURITY: Previous implementation accepted `userId` in the body and
 * used it — IDOR. We now always use the authenticated user's id.
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

    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Neplatné údaje' }, { status: 400 })
    }
    const { restaurantId } = body as { restaurantId?: unknown }
    if (typeof restaurantId !== 'string' || restaurantId.length === 0) {
      return NextResponse.json(
        { error: 'restaurantId je povinné' },
        { status: 400 }
      )
    }

    // Verify restaurant exists
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
      select: { id: true },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }

    // Always use the authenticated user's id — ignore any userId field
    // the client tried to send.
    const targetUserId = user.id

    // Check if already favorited
    const existing = await db.favorite.findUnique({
      where: {
        userId_restaurantId: {
          userId: targetUserId,
          restaurantId,
        },
      },
    })

    if (existing) {
      // Remove from favorites
      await db.favorite.delete({
        where: { id: existing.id },
      })
      return NextResponse.json(
        { favorited: false, message: 'Odstránené z obľúbených' },
        { status: 200 }
      )
    }

    // Add to favorites
    const favorite = await db.favorite.create({
      data: {
        userId: targetUserId,
        restaurantId,
      },
      include: {
        restaurant: {
          select: { id: true, name: true, logo: true },
        },
      },
    })
    return NextResponse.json(
      { favorited: true, favorite, message: 'Pridané do obľúbených' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii obľúbených' },
      { status: 500 }
    )
  }
}
