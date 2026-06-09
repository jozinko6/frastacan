# Task: Expand Admin Section for Fraštačan Food Delivery

## Summary
Expanded the admin section from 3 views to 7 views with sidebar navigation, new API routes, and updated existing views.

## Changes Made

### 1. Store Updates (`src/lib/store.ts`)
- Added new View types: `admin-users`, `admin-coupons`, `admin-zones`, `admin-categories`

### 2. New Admin View Components
- **`src/components/admin-users-view.tsx`** - User management table with search, role filter, active/inactive toggle
- **`src/components/admin-coupons-view.tsx`** - Coupon management with create dialog, toggle active/inactive, expiry tracking
- **`src/components/admin-zones-view.tsx`** - Delivery zone management with inline editing, toggle active/inactive
- **`src/components/admin-categories-view.tsx`** - Category listing grouped by restaurant
- **`src/components/admin-sidebar.tsx`** - Desktop sidebar navigation for admin views with shared nav items config

### 3. New API Routes
- **`src/app/api/admin/users/route.ts`** - GET (paginated, search, role filter) + PATCH (toggle isActive)
- **`src/app/api/admin/coupons/route.ts`** - GET (list all) + POST (create) + PATCH (toggle isActive)
- **`src/app/api/admin/zones/route.ts`** - GET (list all with restaurant count) + PATCH (update zone details/toggle)
- **`src/app/api/admin/categories/route.ts`** - GET (list all with restaurant info)

### 4. Page Layout Updates (`src/app/page.tsx`)
- Complete rewrite of admin navigation:
  - Desktop: Sidebar navigation shown on left when in any admin view
  - Mobile: Bottom navigation bar for admin views
  - Admin header shows back arrow + "Admin" branding instead of regular nav
  - Footer hidden when in admin views
  - Mobile menu adapts to show admin sections when in admin
  - Added `MobileAdminNav` component for bottom bar on mobile
- Added all new view imports and ViewRenderer cases
- Helper functions `isAdminView()` and `isRiderView()`

### 5. Updated Existing Views
- **`src/components/admin-dashboard-view.tsx`** - Added Zones and Coupons stat cards (7 total stat cards), updated grid layout
- **`src/components/admin-restaurants-view.tsx`** - Added city and zone info display, removed back button (sidebar handles nav)
- **`src/components/admin-orders-view.tsx`** - Added city badge display, removed back button

### 6. Updated Existing API Routes
- **`src/app/api/admin/stats/route.ts`** - Added `totalZones` and `totalCoupons` counts
- **`src/app/api/admin/restaurants/route.ts`** - Added `zone` relation in include
- **`src/app/api/admin/restaurants/[id]/route.ts`** - Added `zone` relation in include
- **`src/app/api/admin/orders/route.ts`** - Added `city` field to restaurant select

## Key Design Decisions
- All text in Slovak
- Primary color (#B42318 bordová) used consistently via `text-primary`, `bg-primary`
- Admin views use sidebar + content layout on desktop
- Mobile uses bottom navigation bar for admin (fixed)
- All admin routes verify admin role via `getUserFromRequest`
- Coupon model has no Order relation in Prisma schema, so `_count.orders` was removed
