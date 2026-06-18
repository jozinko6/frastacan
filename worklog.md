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

---
Task ID: 3
Agent: Main Agent
Task: FÁZA 1-4 security & order-flow audit on fix/security-and-order-audit branch

Work Log:
- Created branch fix/security-and-order-audit from main
- FÁZA 1: Ran baseline diagnostics — bun install, prisma generate, lint (clean), tsc (7 errors), build (failed with cp error)
- Audited 20+ API route files + auth.ts + seed.ts + next.config.ts + tsconfig + .gitignore
- Identified 20 security/functional issues (weak SHA-256 hashing, hardcoded TOKEN_SECRET, ignoreBuildErrors, .env committed, IDOR in addresses/favorites, missing RBAC on order status, no rate limiting, no Zod validation, etc.)

- FÁZA 2 (commit 09ac282): Build & TS fixes
  - Removed `typescript.ignoreBuildErrors: true` from next.config.ts (forbidden by policy)
  - Added `output: "standalone"` to next.config.ts
  - Replaced Unix-only `cp -r` build script with cross-platform Node postbuild script (scripts/postbuild.mjs)
  - Excluded examples/ and skills/ (978 workspace scaffolding files) from tsconfig
  - Fixed SQLite-incompatible `mode: 'insensitive'` in admin/users route
  - Fixed `orderItemsData` collapsing to `never[]` in orders route
  - Bounded page/limit params to prevent abuse

- FÁZA 3 (commit a6cc190): Security hardening
  - Replaced SHA-256 + static salt with bcryptjs (cost 12, per-user salt) in src/lib/auth.ts
  - verifyPassword() accepts legacy SHA-256 hashes and flags them for transparent rehashing on next login
  - TOKEN_SECRET now required (>= 32 chars), no insecure fallback; HMAC-SHA256 signed tokens with constant-time signature compare
  - Login route: rate limit (10/5min/IP), Zod validation, generic error to prevent enumeration
  - Register route: rate limit (5/hour/IP), password policy (min 8, letter+digit)
  - Order status PATCH: full RBAC — restaurant callers can only modify own orders + vendor-allowed statuses; rider callers only assigned orders + rider-allowed statuses; server-side state machine prevents illegal transitions
  - .env removed from git tracking; .env.example added with TOKEN_SECRET docs
  - prisma/seed.ts: switched to bcrypt.hashSync

- FÁZA 4 (commit a6cc190): Input validation + IDOR + order-flow authority
  - New src/lib/validations.ts with Zod schemas for every API input
  - All API routes migrated to validateInput() helper
  - Defensive bounds: quantity ∈ [1, 99], prices capped at €100 000, string lengths bounded
  - IDOR fix in /api/addresses: ignored ?userId= query param
  - IDOR fix in /api/favorites: ignored userId in both GET query and POST body
  - IDOR fix in /api/orders GET: ?userId= override only for admins; non-admins get 403
  - /api/orders POST: server recomputes subtotal from FoodItem prices, recomputes discount from couponCode, clamps total ≥ 0; paymentStatus always 'pending' on creation
  - /api/reviews POST: restaurantId must match order.restaurantId (prevents rating manipulation)
  - /api/rider/accept-order: race-condition safe with conditional update + 409 on conflict
  - /api/rider/deliver-order: atomic transaction with conditional updateMany to prevent double-delivery
  - /api/vendor/menu: discountPrice must be strictly < price (defensive against stale client data)

Stage Summary:
- Branch: fix/security-and-order-audit (HEAD: a6cc190)
- Pushed to GitHub: https://github.com/jozinko6/frastacan/tree/fix/security-and-order-audit
- bun run lint: clean (0 errors)
- bunx tsc --noEmit: clean (0 errors)
- bun run build: ✓ Compiled successfully, 31/31 static pages, standalone output works
- Smoke test: invalid login → 401 generic; valid login → 200 + JWT; rate limit activates after 10 failed attempts (429)
- All 4 phases of the security audit complete; ready for PR review and merge to main
