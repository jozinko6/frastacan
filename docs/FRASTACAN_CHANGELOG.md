# Fraštačan – Changelog

## 10. júna 2026 – Počiatočný build projektu

Vytvorenie komplexnej aplikácie na doručovanie jedla od nuly pomocou Next.js 16, Tailwind CSS v4, shadcn/ui a Prisma.

### Zákaznícka časť

| Súbor | Popis |
|---|---|
| `src/components/home-view.tsx` | Homepage s hero sekciami, kategóriami, prevádzkami |
| `src/components/restaurant-view.tsx` | Detail prevádzky s menu kategóriami a položkami |
| `src/components/cart-view.tsx` | Košík s množstvami a poznámkami |
| `src/components/checkout-view.tsx` | Checkout s výberom zóny, adresy, platby, kupónu |
| `src/components/orders-view.tsx` | Zoznam objednávok zákazníka |
| `src/components/order-detail-view.tsx` | Detail objednávky so stavovým sledovaním |
| `src/components/login-view.tsx` | Prihlasovací formulár |
| `src/components/register-view.tsx` | Registračný formulár |
| `src/components/profile-view.tsx` | Profil používateľa s adresami |

### Admin dashboard

| Súbor | Popis |
|---|---|
| `src/components/admin-dashboard-view.tsx` | Prehľad s štatistikami a grafmi |
| `src/components/admin-restaurants-view.tsx` | Správa prevádzok |
| `src/components/admin-orders-view.tsx` | Správa objednávok so zmenou stavu |
| `src/components/admin-users-view.tsx` | Správa zákazníkov |
| `src/components/admin-coupons-view.tsx` | Správa zľavových kupónov |
| `src/components/admin-zones-view.tsx` | Správa doručovacích zón |
| `src/components/admin-categories-view.tsx` | Správa kategórií |
| `src/components/admin-sidebar.tsx` | Bočné menu admin panela |

### Prevádzkový panel

| Súbor | Popis |
|---|---|
| `src/components/vendor-dashboard-view.tsx` | Prehľad prevádzky s štatistikami |
| `src/components/vendor-orders-view.tsx` | Objednávky prevádzky |
| `src/components/vendor-menu-view.tsx` | Správa menu (kategórie a položky) |
| `src/components/vendor-settings-view.tsx` | Nastavenia prevádzky |
| `src/components/vendor-bottom-nav.tsx` | Dolná navigácia prevádzky |

### Kuriérska aplikácia (PWA)

| Súbor | Popis |
|---|---|
| `src/components/rider-dashboard-view.tsx` | Panel kuriéra s dostupnými objednávkami |
| `src/components/rider-orders-view.tsx` | Zoznam doručení kuriéra |
| `src/components/rider-earnings-view.tsx` | Prehľad zárobkov |
| `src/components/rider-profile-view.tsx` | Profil kuriéra s nastaveniami |
| `src/components/rider-bottom-nav.tsx` | Dolná navigácia PWA |
| `src/components/sw-registration.tsx` | Registrácia service workera |
| `public/sw.js` | Service worker s cachovacími stratégiami |
| `public/manifest.json` | PWA manifest |

### Informačné stránky

| Súbor | Popis |
|---|---|
| `src/components/pre-prevadzky-view.tsx` | Landing page pre prevádzky |
| `src/components/pre-kurierov-view.tsx` | Landing page pre kuriérov |
| `src/components/terms-view.tsx` | Obchodné podmienky (pracovný návrh) |
| `src/components/privacy-view.tsx` | Ochrana osobných údajov (pracovný návrh) |
| `src/components/complaints-view.tsx` | Reklamačný poriadok (pracovný návrh) |
| `src/components/contact-view.tsx` | Kontaktná stránka |

### API routes

| Súbor | Popis |
|---|---|
| `src/app/api/auth/login/route.ts` | Prihlásenie |
| `src/app/api/auth/register/route.ts` | Registrácia |
| `src/app/api/auth/me/route.ts` | Získanie aktuálneho používateľa |
| `src/app/api/auth/logout/route.ts` | Odhlásenie |
| `src/app/api/restaurants/route.ts` | Zoznam prevádzok |
| `src/app/api/restaurants/[id]/route.ts` | Detail prevádzky |
| `src/app/api/orders/route.ts` | Vytvorenie a zoznam objednávok |
| `src/app/api/orders/[id]/status/route.ts` | Zmena stavu objednávky |
| `src/app/api/coupons/validate/route.ts` | Validácia kupónu |
| `src/app/api/addresses/route.ts` | Správa adries |
| `src/app/api/reviews/route.ts` | Recenzie |
| `src/app/api/favorites/route.ts` | Obľúbené prevádzky |
| `src/app/api/admin/stats/route.ts` | Admin štatistiky |
| `src/app/api/admin/restaurants/route.ts` | Admin správa prevádzok |
| `src/app/api/admin/restaurants/[id]/route.ts` | Admin detail prevádzky |
| `src/app/api/admin/orders/route.ts` | Admin správa objednávok |
| `src/app/api/admin/users/route.ts` | Admin správa používateľov |
| `src/app/api/admin/coupons/route.ts` | Admin správa kupónov |
| `src/app/api/admin/zones/route.ts` | Admin správa zón |
| `src/app/api/admin/categories/route.ts` | Admin správa kategórií |
| `src/app/api/vendor/route.ts` | Info o prevádzke |
| `src/app/api/vendor/orders/route.ts` | Objednávky prevádzky |
| `src/app/api/vendor/menu/route.ts` | Menu prevádzky |
| `src/app/api/vendor/categories/route.ts` | Kategórie prevádzky |
| `src/app/api/rider/route.ts` | Profil kuriéra |
| `src/app/api/rider/available-orders/route.ts` | Dostupné objednávky |
| `src/app/api/rider/my-orders/route.ts` | Objednávky kuriéra |
| `src/app/api/rider/accept-order/route.ts` | Prijatie objednávky |
| `src/app/api/rider/deliver-order/route.ts` | Doručenie objednávky |
| `src/app/api/rider/earnings/route.ts` | Zárobky kuriéra |

### Zdieľané balíčky a konfigurácia

| Súbor | Popis |
|---|---|
| `src/lib/store.ts` | Zustand store (SPA navigácia, auth, košík, toasty) |
| `src/lib/auth.ts` | Autentifikácia (SHA-256 salted hash, HMAC cookie tokeny) |
| `src/lib/db.ts` | Prisma klient singleton |
| `src/lib/utils-shared.ts` | Zdieľané utility (formatPrice, formatDate, statusConfig, deliveryZones) |
| `src/lib/utils.ts` | shadcn/ui cn() utility |
| `prisma/schema.prisma` | Databázový model (12 modelov) |
| `prisma/seed.ts` | Demo dáta (9 prevádzok, 4 zóny, 2 objednávky, kupóny) |
| `public/frastacan-logo.png` | Logo PNG |
| `public/logo.svg` | Logo SVG |
| `public/robots.txt` | SEO robots |
| `public/manifest.json` | PWA manifest |

### Aplikačný shell

| Súbor | Popis |
|---|---|
| `src/app/layout.tsx` | Root layout s meta tagmi a fontami |
| `src/app/page.tsx` | SPA router – prepína views podľa Zustand store |
| `src/app/globals.css` | Globálne CSS s Fraštačan farebnou schémou |

### Konfigurácie

| Súbor | Popis |
|---|---|
| `next.config.ts` | Next.js konfigurácia (standalone output) |
| `tailwind.config.ts` | Tailwind CSS s vlastnými farbami |
| `components.json` | shadcn/ui konfigurácia |
| `Caddyfile` | Reverse proxy (port 81 → 3000) |
| `.env` | Premenné prostredia |

## Čo bolo dokončené

### Branding a lokalizácia
- Kompletné Fraštačan branding (názov, farby, logo)
- Všetky texty v slovenčine
- Mena EUR s slovenským formátovaním
- Lokálne oblasti: Hlohovec, Šulekovo, Leopoldov, Červeník

### Zákaznícka časť
- Homepage s hero sekciami a kategóriami
- Prezeranie prevádzok s filtrami a vyhľadávaním
- Detail prevádzky s menu kategóriami
- Košík s pridávaním/odstraňovaním položiek
- Checkout s validáciou doručovacích zón
- Zoznam a detail objednávok
- Obľúbené prevádzky
- Recenzie po doručení
- Zľavové kupóny

### Admin dashboard
- Prehľad s kľúčovými metrikami a grafmi
- Správa prevádzok (CRUD)
- Správa objednávok so zmenou stavov
- Správa používateľov
- Správa zľavových kupónov
- Správa doručovacích zón
- Správa kategórií

### Prevádzkový panel
- Prehľad s dennými štatistikami
- Zoznam objednávok s akciami
- Správa menu (kategórie a položky)
- Nastavenia prevádzky

### Kuriérska aplikácia
- Dashboard s dostupnými objednávkami
- Prijatie a doručenie objednávok
- Prehľad zárobkov
- Profil kuriéra
- PWA manifest a service worker
- Offline podpora

### Doručovacie zóny
- 4 zóny s rôznymi poplatkami a minimálnymi objednávkami
- Validácia pri checkout
- Súradnice pre každú zónu

### Právne texty
- Obchodné podmienky (pracovný návrh)
- Ochrana osobných údajov (pracovný návrh)
- Reklamačný poriadok (pracovný návrh)

## Čo závisí na externých službách

| Funkcia | Závislosť | Stav |
|---|---|---|
| Platba kartou | Stripe API | Nenastavené |
| Mapy | Google Maps API | Nenastavené |
| Push notifikácie | Firebase Cloud Messaging | Nenastavené |
| E-mailové notifikácie | SMTP server | Nenastavené |
| Produkčná autentifikácia | Silné AUTH_SALT a TOKEN_SECRET | Nenastavené |

## Odporúčané ďalšie kroky

1. **Bezpečnosť**
   - Zmeniť `AUTH_SALT` a `TOKEN_SECRET` v produkcii
   - Pridať rate limiting na auth endpointy
   - Pridať CSRF ochranu
   - Nastaviť HTTPS

2. **Platby**
   - Integrovať Stripe pre platby kartou
   - Implementovať webhook pre potvrdenie platieb

3. **Mapy**
   - Získať Google Maps API kľúč
   - Integrovať mapu do checkout (výber adresy na mape)
   - Zobraziť polohu kuriéra v reálnom čase

4. **Notifikácie**
   - Nastaviť Firebase pre push notifikácie
   - Nastaviť SMTP pre e-mailové notifikácie (potvrdenie objednávky, zmena stavu)

5. **Právne**
   - Overiť obchodné podmienky s právnikom
   - Overiť dokumenty GDPR
   - Overiť reklamačný poriadok

6. **Výkon a škálovateľnosť**
   - Zvážiť prechod na PostgreSQL pre produkciu
   - Pridať Redis pre cachovanie
   - Optimalizovať obrázky
   - Pridať CDN pre statické súbory

7. **PWA**
   - Rozšíriť service worker o offline stránky
   - Pridať push notifikácie cez service worker
   - Testovať inštaláciu na zariadeniach

8. **Testovanie**
   - Pridať jednotkové testy
   - Pridať integračné testy pre API
   - Pridať E2E testy pre kritické cesty
