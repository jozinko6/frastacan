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

    const categories = await db.category.findMany({
      include: {
        restaurant: {
          select: {
            id: true,
            name: true,
            logo: true,
            city: true,
          },
        },
        _count: {
          select: { foodItems: true },
        },
      },
      orderBy: [
        { restaurant: { name: 'asc' } },
        { sortOrder: 'asc' },
      ],
    })

    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Admin categories error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní kategórií' },
      { status: 500 }
    )
  }
}
