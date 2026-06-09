import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: Prisma.OrderWhereInput = {}
    if (status) {
      where.status = status
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true },
          },
          restaurant: {
            select: { id: true, name: true, logo: true, phone: true },
          },
          rider: {
            select: { id: true, name: true, phone: true },
          },
          items: {
            include: {
              foodItem: {
                select: { id: true, name: true, price: true, image: true },
              },
            },
          },
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Admin orders error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní objednávok' },
      { status: 500 }
    )
  }
}
