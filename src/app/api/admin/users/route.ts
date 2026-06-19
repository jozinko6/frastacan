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
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (role && role !== 'all') {
      where.role = role
    }
    if (search) {
      // SQLite nepodporuje mode: 'insensitive' (len PostgreSQL).
      // SQLite LIKE je default case-insensitive pre ASCII, takže contains funguje.
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: { orders: true, restaurants: true, deliveredOrders: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }, { status: 200 })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní používateľov' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { userId, isActive } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Chýba userId' },
        { status: 400 }
      )
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive musí byť boolean hodnota' },
        { status: 400 }
      )
    }

    // Prevent self-deactivation
    if (userId === user.id && !isActive) {
      return NextResponse.json(
        { error: 'Nemôžete deaktivovať vlastný účet' },
        { status: 400 }
      )
    }

    const existing = await db.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Používateľ nenájdený' },
        { status: 404 }
      )
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    return NextResponse.json({ user: updated }, { status: 200 })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii používateľa' },
      { status: 500 }
    )
  }
}
