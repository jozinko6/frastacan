import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateInput, validateCouponSchema } from '@/lib/validations'

/**
 * POST /api/coupons/validate
 *
 * Public, unauthenticated endpoint used by the cart UI to preview the
 * discount a coupon would apply. The actual discount applied at order
 * creation time is recomputed server-side in /api/orders — the result
 * of this endpoint is purely informational.
 *
 * Notes:
 *   - `subtotal` is the client-supplied cart subtotal. We only use it
 *     to check the coupon's minimum-order threshold for preview
 *     purposes. The authoritative subtotal is computed in
 *     /api/orders from the server's own price lookup.
 *   - `restaurantId` is accepted but currently ignored — coupons are
 *     global in this deployment. The field is kept on the schema for
 *     forward compatibility (per-restaurant coupons).
 *   - We do NOT log coupon validation failures to avoid noise — but
 *     we DO log repeated validation of the same invalid code from the
 *     same IP (rate limiting is a TODO; the login/register endpoints
 *     already have it).
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Neplatný JSON v tele požiadavky' },
        { status: 400 }
      )
    }

    const validation = validateInput(validateCouponSchema, body)
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }
    const { code } = validation.value

    const coupon = await db.coupon.findUnique({
      where: { code: code.toUpperCase() },
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

    // Check minimum order — only if the client provided a subtotal.
    const checkSubtotal = validation.value.subtotal ?? 0
    if (checkSubtotal < coupon.minOrder) {
      return NextResponse.json(
        {
          valid: false,
          error: `Minimálna objednávka pre tento kupón je ${coupon.minOrder.toFixed(2)} €`,
        },
        { status: 400 }
      )
    }

    // Calculate discount
    let discount = (checkSubtotal * coupon.discount) / 100
    if (coupon.maxDiscount !== null && discount > coupon.maxDiscount) {
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
