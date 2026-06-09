import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || user.id

    const favorites = await db.favorite.findMany({
      where: { userId },
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

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const body = await request.json()
    const { userId, restaurantId } = body

    if (!restaurantId) {
      return NextResponse.json(
        { error: 'restaurantId je povinné' },
        { status: 400 }
      )
    }

    // Verify restaurant exists
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }

    const targetUserId = userId || user.id

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
    } else {
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
    }
  } catch (error) {
    console.error('Toggle favorite error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii obľúbených' },
      { status: 500 }
    )
  }
}
