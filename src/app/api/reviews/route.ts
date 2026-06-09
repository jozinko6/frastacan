import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const body = await request.json()
    const { rating, comment, orderId, restaurantId } = body

    if (!rating || !orderId || !restaurantId) {
      return NextResponse.json(
        { error: 'Hodnotenie, objednávka a reštaurácia sú povinné' },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Hodnotenie musí byť medzi 1 a 5' },
        { status: 400 }
      )
    }

    // Check if order exists and belongs to user
    const order = await db.order.findUnique({
      where: { id: orderId },
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
        comment: comment || null,
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
