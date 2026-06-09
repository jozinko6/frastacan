import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, restaurantId, subtotal } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Kód kupónu je povinný' },
        { status: 400 }
      )
    }

    const coupon = await db.coupon.findUnique({
      where: { code },
    })

    if (!coupon) {
      return NextResponse.json(
        { valid: false, error: 'Neplatný kupón' },
        { status: 404 }
      )
    }

    if (!coupon.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Kupón nie je aktívny' },
        { status: 400 }
      )
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Kupón vypršal' },
        { status: 400 }
      )
    }

    // Check minimum order
    const checkSubtotal = subtotal || 0
    if (checkSubtotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimálna objednávka pre tento kupón je ${coupon.minOrder} €`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = (checkSubtotal * coupon.discount) / 100
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount
    }

    discount = Math.round(discount * 100) / 100

    return NextResponse.json({
      valid: true,
      coupon: {
        code: coupon.code,
        discount: coupon.discount,
        maxDiscount: coupon.maxDiscount,
        minOrder: coupon.minOrder,
      },
      discountAmount: discount,
    }, { status: 200 })
  } catch (error) {
    console.error('Validate coupon error:', error)
    return NextResponse.json(
      { error: 'Chyba pri overovaní kupónu' },
      { status: 500 }
    )
  }
}
