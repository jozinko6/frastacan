import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const restaurant = await db.restaurant.findUnique({
      where: { id },
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
          include: {
            foodItems: {
              where: { isAvailable: true },
              orderBy: [{ isPopular: 'desc' }, { name: 'asc' }],
            },
          },
        },
        reviews: {
          include: {
            customer: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        owner: {
          select: { id: true, name: true },
        },
      },
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }

    if (!restaurant.isActive) {
      return NextResponse.json(
        { error: 'Reštaurácia nie je aktívna' },
        { status: 410 }
      )
    }

    // Get popular items separately for easy access
    const popularItems = await db.foodItem.findMany({
      where: {
        restaurantId: id,
        isPopular: true,
        isAvailable: true,
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(
      { restaurant, popularItems },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get restaurant error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní reštaurácie' },
      { status: 500 }
    )
  }
}
