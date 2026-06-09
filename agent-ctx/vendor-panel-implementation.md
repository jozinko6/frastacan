# Vendor Panel Implementation - Task Summary

## Task
Create vendor/restaurant owner panel for the Fraštačan food delivery project.

## Changes Made

### 1. Store Types (src/lib/store.ts)
- Added 4 new View types: `vendor-dashboard`, `vendor-orders`, `vendor-menu`, `vendor-settings`

### 2. Page Integration (src/app/page.tsx)
- Imported 4 vendor view components and `Store` icon
- Added `vendorViews` array and `isVendorView()` helper
- Added vendor view cases in `ViewRenderer` switch
- Added "Prevádzka" nav button for `restaurant` role in desktop Header nav
- Added "Prevádzka panel" entry in MobileMenu for `restaurant` role
- Added `inVendor` check to skip regular Header/Footer layout (like rider views)

### 3. Vendor View Components

#### vendor-bottom-nav.tsx
- Bottom navigation with emerald green color scheme (vs orange for riders)
- 4 tabs: Domov, Objednávky, Menu, Nastavenia
- Active indicator at top with emerald-600 color

#### vendor-dashboard-view.tsx
- Greeting header with availability toggle (Som otvorený / Som zatvorený)
- Stats cards: Dnešné objednávky, Dnešný obrat, Čakajúce objednávky, Aktívne položky
- Recent orders list (last 5) with status badges
- New order notification banner: "Prišla nová objednávka. Potvrďte ju a nastavte približný čas prípravy."
- Auto-refresh every 30 seconds

#### vendor-orders-view.tsx
- Tab-based order filtering: Nové, Potvrdené, Pripravujú sa, Pripravené, Dokončené, Zrušené
- Order cards with expandable items
- Status-specific action buttons:
  - Nová: Prijať / Odmietnuť (with rejection warning)
  - Potvrdená: Začať pripravovať
  - Pripravuje sa: Označiť ako pripravené
  - Pripravená: Odovzdané kuriérovi
- Toast notifications for status changes
- Auto-refresh every 30 seconds

#### vendor-menu-view.tsx
- Category list with collapsible food items
- Toggle food item availability (Eye/EyeOff icons)
- Add new food item (modal dialog)
- Edit food item (modal dialog)
- Delete food item (alert confirmation)
- Add new category (dialog)
- Popularity badges on items
- Discount price display

#### vendor-settings-view.tsx
- Restaurant settings form organized in cards:
  - Základné informácie (name, description, cuisine)
  - Kontakt (phone, email)
  - Adresa (address, city)
  - Otváracie hodiny (opening hours textarea)
  - Doručovanie (delivery type select, minimum order, delivery fee)
- Save button with loading state

### 4. API Routes

#### /api/vendor/route.ts
- GET: Returns restaurant info + stats (todaysOrders, todaysRevenue, pendingOrders, activeMenuItems)
- PATCH: Updates restaurant details (name, description, phone, email, address, city, openingHours, deliveryType, cuisine, minimumOrder, deliveryFee, isAvailable)
- Both verify user has role 'restaurant'

#### /api/vendor/orders/route.ts
- GET: Returns orders for the vendor's restaurant with items, customer info
- Supports optional status filter via query param
- Verifies user has role 'restaurant'

#### /api/vendor/menu/route.ts
- GET: Returns all categories with food items
- POST: Creates new food item (validates category belongs to restaurant)
- PATCH: Updates food item (validates ownership)
- DELETE: Deletes food item (validates ownership)

#### /api/vendor/categories/route.ts
- GET: Returns categories for the restaurant
- POST: Creates new category (auto-increments sortOrder)

## Design Decisions
- Emerald green color scheme to differentiate from rider (orange) and admin (primary) sections
- Vendor section skips regular Header/Footer, uses own bottom nav (like rider)
- All text in Slovak per Fraštačan terminology
- Uses formatPrice from utils-shared.ts consistently
- Follows existing patterns from rider views for consistency
