# Fraštačan – Návod na inštaláciu a spustenie

## Požiadavky

| Nástroj | Verzia |
|---|---|
| Bun | 1.0+ |
| Node.js | 18+ (pre kompatibilitu) |
| Git | Ľubovoľná |

## Inštalácia

### 1. Klonovanie projektu
```bash
cd /home/z
git clone <repo-url> my-project
cd my-project
```

### 2. Inštalácia závislostí
```bash
bun install
```

### 3. Nastavenie prostredia

Vytvorte súbor `.env` v koreni projektu:
```env
DATABASE_URL=file:./db/custom.db
```

Alebo skopírujte z `.env.example`:
```bash
cp .env.example .env
```

### 4. Inicializácia databázy

Vytvorenie databázového schémy:
```bash
bun run db:push
```

### 5. Seedovanie demo dát

Naplnenie databázy ukážkovými dátami:
```bash
bunx prisma db seed
```

Ak seed skript nie je nakonfigurovaný v `package.json`, spustite ho priamo:
```bash
bunx tsx prisma/seed.ts
```

### 6. Spustenie vývojového servera
```bash
bun run dev
```

Aplikácia bude dostupná na `http://localhost:3000`.

### 7. Produkčný build
```bash
bun run build
bun run start
```

## Demo účty

Po seedovaní databázy sú k dispozícii nasledujúce demo účty:

### Admin
| Pole | Hodnota |
|---|---|
| E-mail | admin@frastacan.sk |
| Heslo | admin123 |
| Rola | admin |

### Zákazník
| Pole | Hodnota |
|---|---|
| E-mail | customer@test.sk |
| Heslo | customer123 |
| Rola | customer |

### Kuriér – Hlohovec
| Pole | Hodnota |
|---|---|
| E-mail | rider@frastacan.sk |
| Heslo | rider123 |
| Rola | rider |

### Kuriér – Okolie
| Pole | Hodnota |
|---|---|
| E-mail | rider-okolie@frastacan.sk |
| Heslo | rider123 |
| Rola | rider |

### Majitelia prevádzok
| Prevádzka | E-mail | Heslo |
|---|---|---|
| Slovenská Koliba | slovenska@frastacan.sk | owner123 |
| Pizzeria Roma | talianska@frastacan.sk | owner123 |
| Sushi Master | azska@frastacan.sk | owner123 |
| Burger House | burgeria@frastacan.sk | owner123 |
| El Taco Loco | mexicana@frastacan.sk | owner123 |
| Fraštačan Pizza Demo | pizza@frastacan.sk | owner123 |
| Fraštačan Kaviareň Demo | kaviaren@frastacan.sk | owner123 |
| Fraštačan Potraviny Demo | potraviny@frastacan.sk | owner123 |
| Fraštačan Kvety Demo | kvety@frastacan.sk | owner123 |

### Zľavové kupóny
| Kód | Zľava | Min. objednávka | Max. zľava |
|---|---|---|---|
| FRASTACAN10 | 10 % | 15 € | 5 € |
| VITAJ20 | 20 % | 20 € | 8 € |
| PIZZA15 | 15 % | 10 € | 4 € |

## Prístup k častiam aplikácie

### Zákaznícka časť
- Homepage: `http://localhost:3000`
- Prihlásenie cez tlačidlo v headeri

### Admin dashboard
- Prihláste sa ako admin@frastacan.sk
- V headeri sa zobrazí odkaz na Admin panel

### Prevádzkový panel
- Prihláste sa ako majiteľ prevádzky (napr. slovenska@frastacan.sk)
- V headeri sa zobrazí odkaz na Panel prevádzky

### Kuriérska aplikácia (PWA)
- Prihláste sa ako kuriér (rider@frastacan.sk)
- V headeri sa zobrazí odkaz na Panel kuriéra
- PWA manifest: `http://localhost:3000/manifest.json`
- Service worker: `http://localhost:3000/sw.js`

## Premenné prostredia

### Povinné
| Premenná | Popis | Príklad |
|---|---|---|
| `DATABASE_URL` | Cesta k SQLite databáze | `file:./db/custom.db` |

### Voliteľné – Autentifikácia
| Premenná | Popis | Predvolená hodnota |
|---|---|---|
| `AUTH_SALT` | Soľ pre hashovanie hesiel | `frastacan-salt` |
| `TOKEN_SECRET` | Tajný kľúč pre podpisovanie tokenov | `frastacan-secret-key-2024` |

> **VAROVANIE:** Predvolené hodnoty sú bezpečné len pre vývoj. V produkcii musíte nastaviť silné, unikátne hodnoty!

### Voliteľné – Mapy
| Premenná | Popis |
|---|---|
| `GOOGLE_MAPS_API_KEY` | API kľúč pre Google Maps |

### Voliteľné – Platby
| Premenná | Popis |
|---|---|
| `STRIPE_PUBLIC_KEY` | Verejný kľúč Stripe |
| `STRIPE_SECRET_KEY` | Tajný kľúč Stripe |
| `ENABLE_CARD_PAYMENT` | Povoliť platbu kartou (true/false) |
| `ENABLE_CASH_ON_DELIVERY` | Povoliť hotovosť (true/false) |

### Voliteľné – Notifikácie
| Premenná | Popis |
|---|---|
| `FIREBASE_API_KEY` | Firebase API kľúč |
| `FIREBASE_PROJECT_ID` | Firebase projekt ID |

### Voliteľné – E-mail
| Premenná | Popis |
|---|---|
| `SMTP_HOST` | SMTP server |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP používateľ |
| `SMTP_PASS` | SMTP heslo |
| `EMAIL_FROM` | Odosielateľská adresa |

## Štruktúra projektu

```
my-project/
├── prisma/
│   ├── schema.prisma      # Databázový model
│   └── seed.ts            # Demo dáta
├── public/
│   ├── frastacan-logo.png # Logo PNG
│   ├── logo.svg           # Logo SVG
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── robots.txt         # SEO
├── src/
│   ├── app/
│   │   ├── layout.tsx     # Root layout
│   │   ├── page.tsx       # Hlavná stránka (SPA router)
│   │   ├── globals.css    # Globálne štýly
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── ui/            # shadcn/ui komponenty
│   │   ├── *-view.tsx     # Jednotlivé views
│   │   └── *-nav.tsx      # Navigačné komponenty
│   ├── hooks/             # Custom React hooks
│   └── lib/
│       ├── auth.ts        # Autentifikácia
│       ├── db.ts          # Prisma klient
│       ├── store.ts       # Zustand store
│       ├── utils.ts       # shadcn/ui cn()
│       └── utils-shared.ts # Zdieľané utility
├── docs/                  # Dokumentácia
├── .env                   # Premenné prostredia
├── .env.example           # Vzorové premenné
└── package.json           # Závislosti a skripty
```

## Čo je hotové (checklist)

- [x] Kompletný zákaznícky portál (prezeranie, košík, objednávka)
- [x] Admin dashboard so 7 sekciami
- [x] Prevádzkový panel (dashboard, objednávky, menu, nastavenia)
- [x] Kuriérska aplikácia s PWA podporou
- [x] Doručovacie zóny s validáciou
- [x] Autentifikácia (login, register, logout)
- [x] Zľavové kupóny
- [x] Recenzie a obľúbené prevádzky
- [x] Informačné stránky (pre prevádzky, pre kuriérov)
- [x] Právne texty (obchodné podmienky, ochrana osobných údajov, reklamačný poriadok)
- [x] SEO meta tagy
- [x] Demo dáta s 9 prevádzkami
- [x] Slovenské texty a EUR mena
- [x] Fraštačan branding a farebná schéma

## Čo vyžaduje manuálne nastavenie

- [ ] Produkčné heslá pre AUTH_SALT a TOKEN_SECRET
- [ ] Google Maps API kľúč pre mapovú integráciu
- [ ] Stripe API kľúče pre reálne platby
- [ ] Firebase konfigurácia pre push notifikácie
- [ ] SMTP údaje pre e-mailové notifikácie
- [ ] Reálne právne dokumenty (obchodné podmienky, GDPR, reklamačný poriadok)
- [ ] Overenie doručovacích zón na mape
- [ ] Produkčný hosting a doména

## Čo overiť pred produkciou

1. **Bezpečnosť**
   - Zmeniť AUTH_SALT a TOKEN_SECRET na silné hodnoty
   - Pridať rate limiting na login/register
   - Pridať CSRF ochranu
   - Nastaviť `secure: true` pre cookies (vyžaduje HTTPS)

2. **Databáza**
   - Zvážiť prechod z SQLite na PostgreSQL pre concurrent zápisy
   - Nastaviť pravidelné zálohovanie

3. **Platby**
   - Integrovať Stripe pre platby kartou
   - Otestovať webhooky

4. **Mapy**
   - Získať Google Maps API kľúč
   - Integrovať mapu do checkout a kuriérskeho panela

5. **Notifikácie**
   - Nastaviť Firebase pre push notifikácie
   - Nastaviť SMTP pre e-mailové notifikácie

6. **Výkon**
   - Testovanie pod záťažou
   - Optimalizácia obrázkov (Next.js Image komponent)
   - CDN pre statické súbory

7. **Právne**
   - Overiť obchodné podmienky s právnikom
   - Overiť dokumenty ochrany osobných údajov (GDPR)
   - Overiť reklamačný poriadok

## Riešenie problémov

### Databáza sa nevytvorila
```bash
bun run db:push
bun run db:generate
```

### Seed zlyhal
```bash
# Reset databázy a znova
rm db/custom.db
bun run db:push
bunx tsx prisma/seed.ts
```

### Port 3000 je obsadený
```bash
bun run dev -- -p 3001
```

### Chýbajúce závislosti
```bash
rm -rf node_modules
bun install
```
