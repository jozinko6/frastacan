import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { validateInput, createReviewSchema } from '@/lib/validations'

/**
 * POST /api/reviews
 *
 * Creates a review for an order. Authorisation rules:
 *   - Caller must be authenticated.
 *   - Order must belong to the caller (order.customerId === user.id).
 *   - Order must be in 'delivered' state.
 *   - Order must not have been reviewed yet (1 review per order).
 *   - The `restaurantId` in the body must match `order.restaurantId`
 *     to prevent a customer from creating a review attached to a
 *     different restaurant than the one they actually ordered from.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
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

    const validation = validateInput(createReviewSchema, body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }
    const { rating, comment, orderId, restaurantId } = validation.value

    // Check if order exists and belongs to user
    const order = await db.order.findUnique({
      where: { id: orderId },
      select: { id: true, customerId: true, restaurantId: true, status: true },
    })
    if (!order) {
      return NextResponse.json(
        { error: 'Objednávka nenájdená' },
        { status: 404 }
      )
    }
    if (order.customerId !== user.id) {
      return NextResponse.json(
        { error: 'Môžete hodnotiť iba vlastné objednávky' },
        { status: 403 }
      )
    }
    if (order.status !== 'delivered') {
      return NextResponse.json(
        { error: 'Môžete hodnotiť iba doručené objednávky' },
        { status: 400 }
      )
    }
    // The restaurantId in the body must match the order's restaurantId.
    // This prevents a malicious client from boosting a different
    // restaurant's rating by sending a different restaurantId.
    if (order.restaurantId !== restaurantId) {
      return NextResponse.json(
        { error: 'Reštaurácia v požiadavke nezodpovedá objednávke' },
        { status: 400 }
      )
    }

    // Check if already reviewed
    const existingReview = await db.review.findUnique({
      where: { orderId },
    })
    if (existingReview) {
      return NextResponse.json(
        { error: 'Táto objednávka už bola hodnotená' },
        { status: 409 }
      )
    }

    // Create review
    const review = await db.review.create({
      data: {
        rating,
        comment: comment ?? null,
        orderId,
        customerId: user.id,
        restaurantId,
      },
      include: {
        customer: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // Update restaurant rating
    const restaurantReviews = await db.review.findMany({
      where: { restaurantId },
      select: { rating: true },
    })
    const avgRating = restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length

    await db.restaurant.update({
      where: { id: restaurantId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: restaurantReviews.length,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní hodnotenia' },
      { status: 500 }
    )
  }
}
