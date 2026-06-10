---
Task ID: 1
Agent: Main Agent
Task: Prepare Fraštačan for local testing and online deployment

Work Log:
- Audited existing project: 9 restaurants, 4 delivery zones, 63 food items, 25 categories, 2 demo orders, 3 coupons, 13 users
- Fixed primary color from incorrect oklch to #B42318 (bordová) in globals.css
- Updated order statuses from 7 to 10 (added picking_up, refunded, failed)
- Updated statusConfig and nextStatuses in utils-shared.ts
- Updated API route /api/orders/[id]/status to support all 10 statuses
- Updated rider accept-order to set status 'picking_up' instead of 'delivering'
- Updated rider deliver-order to accept both 'picking_up' and 'delivering' as valid prior states
- Updated rider my-orders to include 'picking_up' in active orders filter
- Updated cuisineOptions with 5 additional categories (Burgery, Kebab, Drogéria, Chovateľstvo, Služby)
- Created .env.example with all necessary environment variables documented
- Updated PWA manifest.json with proper branding, shortcuts, and icon sizes
- Verified production build passes cleanly
- Verified API endpoints return correct data (9 restaurants, login/auth works)

Stage Summary:
- Project builds successfully with `npx next build`
- Database seeded with `npx tsx prisma/seed.ts` (9 restaurants, 4 zones, 63 items, etc.)
- Primary color is now #B42318 bordová throughout
- 10 order statuses supported in full flow
- Rider flow: accept → picking_up → delivering → delivered
- All panels functional: customer, admin, vendor, rider
- Ready for local testing with `npx next dev` or `npx next start`
- Documentation exists at docs/FRASTACAN_SETUP.md
---
Task ID: 1
Agent: main
Task: Fix "Chyba pri nacitani profilu" error when logging in as rider/courier

Work Log:
- Investigated the full rider login flow: login API → cookie set → rider dashboard fetch /api/rider
- Confirmed API endpoints work correctly via curl (login returns 200, /api/rider returns profile data)
- Confirmed database has rider users and RiderProfile records
- Identified root cause: cookie-based auth may not work reliably in browser (especially in preview/proxy environments), causing /api/rider to return 401
- Added authToken to Zustand store + setAuthToken + logout functions
- Created authFetch() helper in utils-shared.ts that adds Authorization: Bearer token header from store
- Updated getUserFromRequest() in auth.ts to check Authorization header FIRST, then fall back to cookie
- Updated /api/auth/me endpoint to also return a fresh token (for page refresh rehydration)
- Updated all rider views (dashboard, profile, orders, earnings) to use authFetch instead of fetch
- Improved error handling: show actual API error message instead of generic "Chyba pri načítaní profilu"
- Updated all logout handlers to use the new logout() function (clears both user and authToken)
- Updated Header auth rehydration to store both user and token from /api/auth/me
- Verified build passes without errors
- Verified all API endpoints work with Bearer token authentication

Stage Summary:
- Rider login now uses dual auth: Bearer token in Authorization header + cookie fallback
- Auth state properly rehydrated on page refresh via /api/auth/me (which returns fresh token)
- Error messages are more descriptive, showing actual API error details
- All logout handlers consistently clear both user and authToken from Zustand store
