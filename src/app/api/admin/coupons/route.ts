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

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ coupons }, { status: 200 })
  } catch (error) {
    console.error('Admin coupons error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní kupónov' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Prístup zamietnutý. Vyžaduje sa administrátorská role.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { code, discount, minOrder, maxDiscount, expiresAt } = body

    if (!code || discount === undefined) {
      return NextResponse.json(
        { error: 'Kód a zľava sú povinné' },
        { status: 400 }
      )
    }

    if (discount < 0 || discount > 100) {
      return NextResponse.json(
        { error: 'Zľava musí byť medzi 0 a 100 percentami' },
        { status: 400 }
      )
    }

    // Check unique code
    const existing = await db.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (existing) {
      return NextResponse.json(
        { error: 'Kupón s týmto kódom už existuje' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error('Create coupon error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní kupónu' },
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
    const { couponId, isActive } = body

    if (!couponId) {
      return NextResponse.json(
        { error: 'Chýba couponId' },
        { status: 400 }
      )
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive musí byť boolean hodnota' },
        { status: 400 }
      )
    }

    const existing = await db.coupon.findUnique({ where: { id: couponId } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Kupón nenájdený' },
        { status: 404 }
      )
    }

    const coupon = await db.coupon.update({
      where: { id: couponId },
      data: { isActive },
    })

    return NextResponse.json({ coupon }, { status: 200 })
  } catch (error) {
    console.error('Update coupon error:', error)
    return NextResponse.json(
      { error: 'Chyba pri aktualizácii kupónu' },
      { status: 500 }
    )
  }
}
