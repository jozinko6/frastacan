# Rider API Routes - Work Summary

## Task: Create Rider API routes for Fraštačan food delivery system

## Files Created

### 1. `src/app/api/rider/route.ts`
- **GET** - Returns rider profile, user data, active orders count, and today's earnings
  - Auto-creates RiderProfile if not found
  - Counts orders with status 'delivering' for active orders
  - Calculates today's earnings from delivered orders since midnight
- **PATCH** - Updates rider availability (`isAvailable`) and location (`currentLat`, `currentLng`)
  - Auto-creates RiderProfile if not found
  - Validates at least one field is provided for update

### 2. `src/app/api/rider/available-orders/route.ts`
- **GET** - Lists orders with status 'ready' that have no rider assigned (`riderId: null`)
  - Includes restaurant info (name, address, phone, logo)
  - Includes customer info (name, phone)
  - Includes order items with food item details
  - Ordered by `createdAt` ascending (oldest first)

### 3. `src/app/api/rider/earnings/route.ts`
- **GET** - Returns comprehensive earnings data
  - Total earnings, wallet balance, total deliveries from RiderProfile
  - Earnings by day (last 7 days) - all 7 days initialized with 0
  - Delivery count by day (last 7 days)
  - Recent delivery history with restaurant info

### 4. `src/app/api/rider/accept-order/route.ts`
- **POST** - Rider accepts an order
  - Validates rider is available (`isAvailable === true`)
  - Validates order status is 'ready' and has no rider assigned
  - Sets `riderId` to current rider, updates status to 'delivering'
  - Returns updated order with items, restaurant, and customer info

### 5. `src/app/api/rider/deliver-order/route.ts`
- **POST** - Rider marks order as delivered
  - Validates rider is the assigned rider for the order
  - Validates order status is 'delivering'
  - Uses Prisma transaction to atomically:
    - Update order status to 'delivered' and set `deliveredAt`
    - Increment rider's `totalDeliveries` by 1
    - Add `deliveryFee` to rider's `totalEarnings` and `walletBalance`
  - Returns updated order and updated rider profile

## Key Design Decisions
- All routes verify `user.role === 'rider'` before proceeding
- RiderProfile auto-creation on GET endpoints to avoid 404s for new riders
- Slovak language error messages consistent with existing codebase
- Atomic transaction in deliver-order prevents data inconsistency
- Earnings by day initializes all 7 days for consistent chart data
