# Fraštačan – Audit projektu

## Dátum auditu
10. júna 2026

## 1. Základná štruktúra

### Hlavné priečinky
- `src/app/` – Next.js App Router (stránky a API routes)
- `src/components/` – React komponenty (views a UI)
- `src/lib/` – Zdieľané utility, store, auth
- `src/hooks/` – Custom React hooks
- `prisma/` – Databázový schema a seed
- `public/` – Statické súbory (logo, manifest, SW)
- `docs/` – Dokumentácia

### Zákaznícka časť
- `src/components/home-view.tsx` – Homepage s hero sekciami
- `src/components/restaurant-view.tsx` – Detail prevádzky
- `src/components/cart-view.tsx` – Košík
- `src/components/checkout-view.tsx` – Objednávka s doručovacími zónami
- `src/components/orders-view.tsx` – Zoznam objednávok
- `src/components/order-detail-view.tsx` – Detail objednávky
- `src/components/login-view.tsx` – Prihlásenie
- `src/components/register-view.tsx` – Registrácia
- `src/components/profile-view.tsx` – Profil používateľa

### Admin dashboard
- `src/components/admin-dashboard-view.tsx` – Prehľad
- `src/components/admin-restaurants-view.tsx` – Prevádzky
- `src/components/admin-orders-view.tsx` – Objednávky
- `src/components/admin-users-view.tsx` – Zákazníci
- `src/components/admin-coupons-view.tsx` – Kupóny
- `src/components/admin-zones-view.tsx` – Doručovacie zóny
- `src/components/admin-categories-view.tsx` – Kategórie

### Kuriérska aplikácia (PWA)
- `src/components/rider-dashboard-view.tsx` – Panel kuriéra
- `src/components/rider-orders-view.tsx` – Zoznam doručení
- `src/components/rider-earnings-view.tsx` – Zárobky
- `src/components/rider-profile-view.tsx` – Profil kuriéra
- `src/components/rider-bottom-nav.tsx` – Dolná navigácia PWA
- `public/sw.js` – Service worker
- `public/manifest.json` – PWA manifest

### Prevádzkový panel
- `src/components/vendor-dashboard-view.tsx` – Panel prevádzky
- `src/components/vendor-orders-view.tsx` – Objednávky prevádzky
- `src/components/vendor-menu-view.tsx` – Správa menu
- `src/components/vendor-settings-view.tsx` – Nastavenia prevádzky
- `src/components/vendor-bottom-nav.tsx` – Dolná navigácia

### Informačné stránky
- `src/components/pre-prevadzky-view.tsx` – Pre prevádzky
- `src/components/pre-kurierov-view.tsx` – Pre kuriérov
- `src/components/terms-view.tsx` – Obchodné podmienky
- `src/components/privacy-view.tsx` – Ochrana osobných údajov
- `src/components/complaints-view.tsx` – Reklamačný poriadok
- `src/components/contact-view.tsx` – Kontakt

### API routes
- `src/app/api/auth/` – Autentifikácia (login, register, me, logout)
- `src/app/api/restaurants/` – Prevádzky
- `src/app/api/orders/` – Objednávky
- `src/app/api/admin/` – Admin endpointy (stats, restaurants, orders, users, coupons, zones, categories)
- `src/app/api/vendor/` – Prevádzkový panel (restaurant info, orders, menu, categories)
- `src/app/api/rider/` – Kuriérske endpointy (profile, orders, earnings, accept, deliver)
- `src/app/api/coupons/` – Kupóny
- `src/app/api/addresses/` – Adresy
- `src/app/api/reviews/` – Recenzie
- `src/app/api/favorites/` – Obľúbené

### Zdieľané balíčky
- `src/lib/store.ts` – Zustand store (SPA navigácia, auth, košík)
- `src/lib/auth.ts` – Autentifikácia (SHA-256 + HMAC cookie)
- `src/lib/db.ts` – Prisma klient
- `src/lib/utils-shared.ts` – Zdieľané utility (formatPrice, formatDate, statusConfig, deliveryZones)
- `src/lib/utils.ts` – shadcn/ui cn() utility
- `src/components/ui/` – 46 shadcn/ui komponentov

### Konfigurácie
- `prisma/schema.prisma` – Databázový model
- `tailwind.config.ts` – Tailwind CSS konfigurácia
- `next.config.ts` – Next.js konfigurácia
- `components.json` – shadcn/ui konfigurácia
- `public/manifest.json` – PWA manifest
- `Caddyfile` – Reverse proxy konfigurácia (port 81 → 3000)

### Témy, farby, logá
- Primárna: bordová #B42318
- Sekundárna: grafitová #1F2937
- Pozadie: krémová #FFF7ED
- Akcent: oranžová #F97316
- Logo: `/public/frastacan-logo.png`, `/public/logo.svg`

### API URL
- Všetky API sú lokálne cez Next.js API routes
- Žiadny externý API server

### Platobné metódy
- Platba kartou vopred (textovo, bez reálnej integrácie)
- Hotovosť pri prevzatí

### Mapy a geolokácia
- Momentálne nie sú integrované mapy
- Súradnice sú uložené v databáze pre doručovacie zóny
- Vyžaduje Google Maps API kľúč pre ostrú prevádzku

## 2. Technológie

| Technológia | Verzia/Použitie |
|---|---|
| Framework | Next.js 16.1 (App Router) |
| Runtime | Bun |
| Databáza | SQLite cez Prisma |
| UI | Tailwind CSS v4 + shadcn/ui |
| Stav | Zustand (SPA navigácia) |
| Auth | SHA-256 salted hash + HMAC-signed cookies |
| Jazyk | TypeScript |
| Mapy | Nie sú integrované |
| Platby | Textové označenie, bez reálnej integrácie |
| Notifikácie | Toast notifikácie (sonner), žiadne push |
| i18n | Žiadny framework, texty priamo v kóde (sk) |
| Build | `next build` (standalone output) |
| Env | `.env` s DATABASE_URL |

## 3. Databázový model

| Model | Popis |
|---|---|
| User | Používatelia (customer, admin, restaurant, rider) |
| Restaurant | Prevádzky s väzbou na DeliveryZone |
| Category | Kategórie menu (väzba na Restaurant) |
| FoodItem | Položky menu (väzba na Category a Restaurant) |
| Order | Objednávky so status flow |
| OrderItem | Položky objednávky |
| Address | Adresy používateľov |
| Review | Recenzie objednávok |
| Favorite | Obľúbené prevádzky |
| Coupon | Zľavové kupóny |
| DeliveryZone | Doručovacie zóny (súradnice, poplatky) |
| RiderProfile | Profily kuriérov (zárobky, rating) |

### Stavový diagram objednávky
```
pending → confirmed → preparing → ready → delivering → delivered
   ↓         ↓           ↓         ↓
cancelled  cancelled  cancelled  cancelled
```

## 4. Rizikové miesta

- **Hardcoded salt a token secret** v auth.ts – hodnoty `frastacan-salt` a `frastacan-secret-key-2024` sú priamo v kóde ako fallback
- **Bez rate limitingu** na login/register endpointoch – zraniteľné voči brute-force útokom
- **Bez CSRF ochrany** – cookie-based auth bez CSRF tokenov
- **Žiadna reálna platobná integrácia** – platba kartou je len textové označenie
- **Mapy nie sú integrované** – súradnice v DB, ale bez vizuálneho zobrazenia
- **Push notifikácie nie sú implementované** – iba toast notifikácie v UI
- **Service worker je základný** – cachovanie app shell a API, ale bez pokročilých offline stránok
- **Bez e-mailových notifikácií** – žiadna SMTP konfigurácia
- **SPA navigácia bez URL** – Zustand store mení views bez zmeny URL, používateľ nemôže použiť back/forward
- **SQLite pre produkciu** – nie je vhodný pre concurrent zápisy pri väčšom zaťažení

## 5. Odporúčané úpravy (checklist)

- [x] Branding Fraštačan
- [x] Slovenské texty
- [x] EUR mena
- [x] Lokálne oblasti (Hlohovec, Šulekovo, Leopoldov, Červeník)
- [x] Doručovacie zóny
- [x] Kategórie prevádzok
- [x] Demo dáta
- [x] Homepage podľa specifikácie
- [x] Checkout s validáciou zón
- [x] Admin dashboard (7 sekcíí)
- [x] Prevádzkový panel
- [x] Kuriérsky panel (PWA)
- [x] Právne texty (pracovné návrhy)
- [x] SEO meta tagy
- [ ] Reálna platobná integrácia (Stripe)
- [ ] Mapová integrácia
- [ ] Push notifikácie
- [ ] E-mailové notifikácie
- [ ] Rate limiting
- [ ] CSRF ochrana
- [ ] Reálne právne dokumenty
- [ ] Produkčné nasadenie
