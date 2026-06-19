import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

type OrderItemInput = {
  quantity: number
  price: number
  notes: string | null
  foodItemId: string
}

type IncomingCartItem = {
  foodItemId: string
  quantity: number
  notes?: string | null
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Neprihlásený' }, { status: 401 })
    }

    const body = await request.json()
    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod = 'cash',
      notes,
      couponCode,
    } = body

    if (!restaurantId || !items || !items.length || !deliveryAddress) {
      return NextResponse.json(
        { error: 'Chýbajú povinné údaje: reštaurácia, položky a doručovacia adresa' },
        { status: 400 }
      )
    }

    // Verify restaurant exists and is available
    const restaurant = await db.restaurant.findUnique({
      where: { id: restaurantId },
    })
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Reštaurácia nenájdená' },
        { status: 404 }
      )
    }
    if (!restaurant.isActive || !restaurant.isAvailable) {
      return NextResponse.json(
        { error: 'Reštaurácia momentálne neprijíma objednávky' },
        { status: 400 }
      )
    }

    // Calculate subtotal from food items
    const foodItemIds = items.map((item: IncomingCartItem) => item.foodItemId)
    const foodItems = await db.foodItem.findMany({
      where: { id: { in: foodItemIds }, restaurantId },
    })

    if (foodItems.length !== foodItemIds.length) {
      return NextResponse.json(
        { error: 'Niektoré položky neboli nájdené alebo nepatria do tejto reštaurácie' },
        { status: 400 }
      )
    }

    // Build a map for quick lookup
    const foodItemMap = new Map(foodItems.map((fi) => [fi.id, fi]))

    let subtotal = 0
    const orderItemsData: OrderItemInput[] = []

    for (const item of items as IncomingCartItem[]) {
      const foodItem = foodItemMap.get(item.foodItemId)
      if (!foodItem) {
        return NextResponse.json(
          { error: `Položka ${item.foodItemId} nenájdená` },
          { status: 400 }
        )
      }
      if (!foodItem.isAvailable) {
        return NextResponse.json(
          { error: `Položka "${foodItem.name}" nie je dostupná` },
          { status: 400 }
        )
      }

      const price = foodItem.discountPrice ?? foodItem.price
      const itemTotal = price * item.quantity
      subtotal += itemTotal

      orderItemsData.push({
        quantity: item.quantity,
        price,
        notes: item.notes || null,
        foodItemId: item.foodItemId,
      })
    }

    // Check minimum order
    if (subtotal < restaurant.minimumOrder) {
      return NextResponse.json(
        { error: `Minimálna objednávka je ${restaurant.minimumOrder} €` },
        { status: 400 }
      )
    }

    const deliveryFee = restaurant.deliveryFee

    // Calculate discount from coupon
    let discount = 0
    if (couponCode) {
      const coupon = await db.coupon.findUnique({
        where: { code: couponCode },
      })
      if (coupon && coupon.isActive) {
        if (coupon.expiresAt && coupon.expiresAt < new Date()) {
          return NextResponse.json(
            { error: 'Kupón vypršal' },
            { status: 400 }
          )
        }
        if (subtotal >= coupon.minOrder) {
          discount = (subtotal * coupon.discount) / 100
          if (coupon.maxDiscount && discount > coupon.maxDiscount) {
            discount = coupon.maxDiscount
          }
        } else {
          return NextResponse.json(
            { error: `Minimálna objednávka pre kupón je ${coupon.minOrder} €` },
            { status: 400 }
          )
        }
      } else if (couponCode) {
        return NextResponse.json(
          { error: 'Neplatný kupón' },
          { status: 400 }
        )
      }
    }

    const total = Math.max(0, subtotal + deliveryFee - discount)

    // Generate unique order number
    const lastOrder = await db.order.findFirst({
      orderBy: { createdAt: 'desc' },
      select: { orderNumber: true },
    })
    let nextNumber = 1
    if (lastOrder?.orderNumber) {
      const match = lastOrder.orderNumber.match(/FR-(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1
      }
    }
    const orderNumber = `FR-${String(nextNumber).padStart(3, '0')}`

    // Create order with items
    const order = await db.order.create({
      data: {
        orderNumber,
        status: 'pending',
        paymentMethod,
        paymentStatus: paymentMethod === 'card' ? 'pending' : 'pending',
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee: Math.round(deliveryFee * 100) / 100,
        discount: Math.round(discount * 100) / 100,
        total: Math.round(total * 100) / 100,
        notes: notes || null,
        deliveryAddress,
        customerId: user.id,
        restaurantId,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            foodItem: true,
          },
        },
        restaurant: {
          select: { id: true, name: true, image: true, logo: true, phone: true },
        },
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json(
      { error: 'Chyba pri vytváraní objednávky' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userIdParam = searchParams.get('userId')
    const status = searchParams.get('status')

    // Try to get user from auth (token or cookie)
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Neprihlásený' },
        { status: 401 }
      )
    }

    // For security, prefer the authenticated user's id. Allow overriding with
    // query param only for admins (e.g. admin dashboard listing all orders).
    let userId = user.id
    if (userIdParam && user.role === 'admin') {
      userId = userIdParam
    }

    const where: Record<string, unknown> = { customerId: userId }
    if (status) {
      where.status = status
    }

    const orders = await db.order.findMany({
      where,
      include: {
        items: {
          include: {
            foodItem: {
              select: { id: true, name: true, image: true, price: true },
            },
          },
        },
        restaurant: {
          select: { id: true, name: true, image: true, logo: true },
        },
        rider: {
          select: { id: true, name: true, phone: true },
        },
        review: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders }, { status: 200 })
  } catch (error) {
    console.error('List orders error:', error)
    return NextResponse.json(
      { error: 'Chyba pri načítaní objednávok' },
      { status: 500 }
    )
  }
}
