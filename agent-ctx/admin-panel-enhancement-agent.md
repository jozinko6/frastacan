# Task: Fix and Enhance Fraštačan Admin Panel + Restaurant Toggle API

## Summary

Completed all 4 tasks successfully with zero lint errors.

## Files Modified/Created

### 1. NEW: `src/app/api/admin/restaurants/[id]/route.ts`
- PATCH endpoint for toggling `isActive` and `isAvailable` fields
- Admin-only access via `getUserFromRequest`
- Validates body fields (type checking, at least one field required)
- Checks restaurant exists (404 if not)
- Returns updated restaurant with full includes (owner, categories, counts)

### 2. REWRITTEN: `src/components/admin-dashboard-view.tsx`
- Removed local `formatPrice`, `formatDate`, `statusConfig` → imported from `@/lib/utils-shared`
- Added 5th stat card: "Jedlá" (totalFoodItems) with UtensilsCrossed icon and rose color
- Added empty states for recent orders (Package icon) and top restaurants (Store icon)
- Added refresh button with RefreshCw icon (spinning while loading)
- Used `useCallback` for fetchStats to prevent unnecessary re-fetches
- Fixed grid layout: `grid-cols-2 lg:grid-cols-5` for 5 stat cards
- Added broken image fallback for top restaurant logos

### 3. REWRITTEN: `src/components/admin-restaurants-view.tsx`
- Removed local `formatPrice` → imported from `@/lib/utils-shared`
- Also imported `cuisineOptions` for filter buttons
- Added search input (name, cuisine, address) with Search icon
- Added cuisine filter pills (using cuisineOptions from shared utils)
- Added toggle buttons for isActive/isAvailable → calls PATCH `/api/admin/restaurants/[id]`
- Fixed null logo rendering: conditional render with Store icon fallback
- Added broken image fallback for restaurant cover images (ImageOff component)
- Added empty state (with filter reset button when filters active)
- Added refresh button with spinning animation
- Local state updates after toggle (no full refetch needed)

### 4. REWRITTEN: `src/components/admin-orders-view.tsx`
- Removed local `formatPrice`, `formatDate`, `statusConfig`, `nextStatuses` → all imported from `@/lib/utils-shared`
- Also imported `paymentStatusConfig` for payment status badges
- Added payment status badge next to payment method badge
- Added rider info display (Bike icon, name, phone with clickable tel: link)
- Added pagination UI (prev/next buttons, page/totalPages display)
- Added status transition validation before API call (checks `nextStatuses` map)
- Fixed potential double fetch: used `useCallback` for `fetchOrders`, proper deps in `useEffect`
- Passes `page` parameter to API for server-side pagination

## Lint Result
- ✅ Zero errors, zero warnings

## Dev Server
- ✅ Running cleanly, no compilation errors
