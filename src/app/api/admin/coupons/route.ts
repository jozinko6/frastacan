import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, createCouponSchema, updateCouponSchema } from '@/lib/validations'

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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(createCouponSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { code, discount, minOrder, maxDiscount, expiresAt } = validation.value

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
        discount,
        minOrder: minOrder ?? 0,
        maxDiscount: maxDiscount ?? null,
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

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(updateCouponSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { couponId, isActive } = validation.value

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
