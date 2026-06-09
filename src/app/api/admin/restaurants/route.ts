import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const restaurants = await db.restaurant.findMany({
      include: {
        owner: {
          select: { id: true, name: true, email: true, phone: true },
        },
        zone: {
          select: { id: true, name: true, type: true },
        },
        categories: {
          include: {
            _count: { select: { foodItems: true } },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            foodItems: true,
            orders: true,
            reviews: true,
            favorites: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ restaurants }, { status: 200 })
  } catch (error) {
    console.error('Admin restaurants error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní reštaurácií' },
      { status: 500 }
    )
  }
}
