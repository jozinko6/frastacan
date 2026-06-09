# Rider PWA Views Implementation

## Summary
Implemented complete Rider PWA views for the Fraštačan food delivery system. The rider interface is a mobile-first PWA with bottom navigation, orange (#F97316) brand color, and Slovak language UI.

## Files Created/Modified

### New Files
1. **`src/components/rider-bottom-nav.tsx`** - Shared bottom navigation with 4 tabs (Dashboard, Objednávky, Príjmy, Profil) with orange active state
2. **`src/components/rider-dashboard-view.tsx`** - Main dashboard with greeting, availability toggle, stats cards, available orders, active deliveries, auto-refresh (30s)
3. **`src/components/rider-orders-view.tsx`** - Order history with tab filters (All/Active/Delivered), expandable order details
4. **`src/components/rider-earnings-view.tsx`** - Earnings dashboard with 7-day CSS bar chart, wallet balance, recent deliveries, withdrawal toast
5. **`src/components/rider-profile-view.tsx`** - Rider profile with avatar, vehicle type, rating stars, stats grid, availability toggle, logout
6. **`src/app/api/rider/my-orders/route.ts`** - New API endpoint for rider's assigned orders (with status filtering)

### Modified Files
1. **`src/app/page.tsx`** - Added rider view imports, ViewRenderer cases, rider nav button, mobile menu item, conditional header/footer hiding for rider views
2. **`src/components/login-view.tsx`** - Added rider demo account button, role-based redirect after login
3. **`src/lib/auth.ts`** - Added `verifyPassword()` function with fallback for legacy unsalted password hashes
4. **`src/lib/db.ts`** - Restored global PrismaClient caching pattern

## Key Design Decisions
- Mobile-first PWA with sticky bottom navigation
- Rider views hide the regular header/footer for immersive mobile experience
- All UI text in Slovak language
- Orange (#F97316) active tab color
- Large touch targets (min 44px) for mobile usability
- Auto-refresh every 30 seconds on dashboard when available
- Expandable order details with AnimatePresence animations
- CSS-based bar chart (no chart library) for 7-day earnings
- Loading skeletons and error states with retry buttons

## Test Data
Created test orders via direct Prisma manipulation:
- 2 orders in 'ready' status (available for pickup)
- 1 order in 'delivering' status assigned to rider
- 6 orders in 'delivered' status for history and earnings chart

## Auth Fix
Discovered that the original seed used unsalted SHA-256 hashes while the auth module uses salted hashes. Added `verifyPassword()` with fallback support for both methods.
