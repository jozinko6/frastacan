import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cuisine = searchParams.get('cuisine')
    const search = searchParams.get('search')

    const where: Prisma.RestaurantWhereInput = {
      isActive: true,
    }

    if (cuisine) {
      where.cuisine = { contains: cuisine }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { cuisine: { contains: search } },
      ]
    }

    const restaurants = await db.restaurant.findMany({
      where,
      include: {
        categories: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { foodItems: true, reviews: true },
        },
      },
      orderBy: { rating: 'desc' },
    })

    return NextResponse.json({ restaurants }, { status: 200 })
  } catch (error) {
    console.error('List restaurants error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní reštaurácií' },
      { status: 500 }
    )
  }
}
