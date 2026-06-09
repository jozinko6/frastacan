# Rider PWA Enhancement - Work Summary

## Task: Enhance rider/courier section as PWA with Slovak text updates

### Completed Changes:

#### 1. Service Worker (`public/sw.js`)
- Created a full service worker with:
  - Cache-first strategy for static assets (JS, CSS, images, fonts)
  - Network-first strategy for API calls with offline JSON fallback
  - Navigation network-first with offline HTML fallback page (Slovak text)
  - Proper cache versioning and old cache cleanup on activate
  - App shell pre-caching on install

#### 2. Service Worker Registration (`src/components/sw-registration.tsx`)
- Created client component that registers SW on mount
- Added to `layout.tsx` as `<ServiceWorkerRegistration />`

#### 3. Rider Dashboard View (`src/components/rider-dashboard-view.tsx`)
- Updated color scheme from `orange-500` to bordová `#B42318` throughout
- Updated Slovak text per spec:
  - "Som dostupný" / "Som nedostupný" for availability toggle
  - "Nová doručovacia úloha" for available orders section
  - "Prijať doručenie" for accept button
  - "Navigovať do prevádzky" for navigate to restaurant
  - "Prevzal som objednávku" for pickup confirmation
  - "Navigovať k zákazníkovi" for navigate to customer
  - "Doručené" for delivered
- Added vehicle type display with Bicykel, Skúter, Auto, Pešo options
- Added call/contact functionality:
  - "Zavolať zákazníkovi" button (tel: link)
  - "Zavolať prevádzke" button (tel: link)
- Added cash payment info display (amber box with amount to collect)
- Added city/zone display for orders
- Added delivery workflow: Navigate to restaurant → Pickup → Navigate to customer → Deliver

#### 4. Rider Orders View (`src/components/rider-orders-view.tsx`)
- Updated to bordová `#B42318` color scheme
- Added city/zone info display on orders
- Added cash payment info with "Vybrať hotovosť pri prevzatí" note
- Added contact buttons (Zavolať prevádzke, Zavolať zákazníkovi) for active orders
- Added "Navigovať k zákazníkovi" navigation link
- Proper Slovak terminology throughout

#### 5. Rider Earnings View (`src/components/rider-earnings-view.tsx`)
- Updated to bordová `#B42318` color scheme
- Changed header from "Príjmy" to "Zárobky"
- Added cash collection summary for recent cash deliveries
- Added "Vybrať hotovosť pri prevzatí" info box with total amount
- Added Banknote icon for cash payment indicators
- Updated chart bars to bordová color scheme

#### 6. Rider Profile View (`src/components/rider-profile-view.tsx`)
- Updated to bordová `#B42318` color scheme
- Added vehicle type selection grid: Bicykel, Skúter, Auto, Pešo
- Vehicle type change API integration (PATCH /api/rider)
- Updated Slovak text: "Som dostupný" / "Som nedostupný"
- Proper Footprints icon for "Pešo" option

#### 7. Rider Bottom Nav (`src/components/rider-bottom-nav.tsx`)
- Updated labels: Domov, Objednávky, Zárobky, Profil
- Updated active indicator to bordová `#B42318`

#### 8. PWA Manifest (`public/manifest.json`)
- Updated name to "Fraštačan – lokálne doručenie"
- Verified short_name: "Fraštačan"
- Verified display: "standalone"
- Verified theme_color: "#B42318"
- Verified background_color: "#FFF7ED"

#### 9. API Routes Updated
- `available-orders/route.ts`: Added city, zone info to restaurant select; Added cashToCollect field
- `my-orders/route.ts`: Added city, zone info to restaurant select; Added cashToCollect field
- `earnings/route.ts`: Added paymentMethod to recentDeliveries select
- `accept-order/route.ts`: Added city, zone info; Added cashToCollect in response
- `deliver-order/route.ts`: Added city to restaurant select
- `rider/route.ts`: Added vehicleType support in PATCH endpoint (bicycle, scooter, car, foot)

#### 10. Prisma Schema
- Updated vehicleType comment from "bicycle, motorcycle, car" to "bicycle, scooter, car, foot"

### Key Design Decisions:
- Bordová (#B42318) used consistently as the rider PWA brand color
- All text in Slovak language
- Cash payment awareness throughout all rider views
- Vehicle type supports 4 options: Bicykel, Skúter, Auto, Pešo
- PWA feels standalone with proper manifest, service worker, and offline support
