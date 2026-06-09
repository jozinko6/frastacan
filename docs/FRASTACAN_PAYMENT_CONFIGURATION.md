# Fraštačan – Konfigurácia platieb

## Prehľad

Fraštačan podporuje dve platobné metódy. Jedna je plne funkčná (hotovosť), druhá je pripravená na integráciu (karta).

## Aktívne platobné metódy

### 1. Hotovosť pri prevzatí

| Parameter | Hodnota |
|---|---|
| Kód v systéme | `cash` |
| Stav | Plne funkčná |
| Popis | Zákazník platí v hotovosti pri doručení |
| Integrácia | Žiadna externá služba |
| Stav platby | Automaticky `pending` až do doručenia |

**Funkčnosť:**
- Zákazník vyberie "Hotovosť pri prevzatí" pri checkout
- Objednávka sa vytvorí s `paymentMethod: "cash"` a `paymentStatus: "pending"`
- Po doručení objednávky admin/kuriér zmení stav platby na `paid`
- Žiadna externá integrácia nie je potrebná

### 2. Platba kartou vopred

| Parameter | Hodnota |
|---|---|
| Kód v systéme | `card` |
| Stav | Textové označenie, bez reálnej integrácie |
| Popis | Zákazník vyberie platbu kartou, ale transakcia sa nespracuje |
| Integrácia | Vyžaduje Stripe (nie je implementovaná) |
| Stav platby | Automaticky `pending` – vyžaduje manuálnu zmenu |

**Súčasný stav:**
- Možnosť je zobrazená v checkout UI
- Pri výbere sa objednávka vytvorí s `paymentMethod: "card"` a `paymentStatus: "pending"`
- **Žiadna reálna platobná brána nie je zapojená**
- Status platby sa nemení automaticky na `paid`
- Pre ostrú prevádzku je potrebná integrácia so Stripe

## Skryté / zakázané platobné metódy

Nasledujúce metódy **nie sú** implementované ani zobrazené v UI:

| Metóda | Stav | Poznámka |
|---|---|---|
| PayPal | Zakázaná | `ENABLE_PAYPAL=false` |
| Kryptomeny | Neimplementovaná | Nie v pláne |
| Bankový prevod | Neimplementovaná | Nie v pláne |
| Elektronická peňaženka (wallet) | Neimplementovaná | Možné v budúcnosti |

## Mena a locale

| Parameter | Hodnota |
|---|---|
| Mena | EUR (€) |
| Locale | sk-SK |
| Formátovanie ceny | `12,50 €` (čiarka ako desatinný oddeľovač) |
| Funkcia formátovania | `formatPrice()` v `src/lib/utils-shared.ts` |

```typescript
export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' €'
}
```

## Stavy platieb

Platobné stavy sú definované v `src/lib/utils-shared.ts`:

| Stav | Label | Farba |
|---|---|---|
| `pending` | Čaká na platbu | žltá |
| `paid` | Zaplatené | zelená |
| `failed` | Platba zlyhala | červená |

## Databázový model

Platobné informácie sú súčasťou modelu `Order`:

```prisma
model Order {
  paymentMethod   String    @default("cash") // cash, card
  paymentStatus   String    @default("pending") // pending, paid, failed
  // ...
}
```

## Integrácia Stripe (odporúčaný postup)

Pre implementáciu reálnych platieb kartou sa odporúča Stripe:

### 1. Inštalácia
```bash
bun add stripe @stripe/stripe-js
```

### 2. Premenné prostredia
```env
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
ENABLE_CARD_PAYMENT=true
```

### 3. Vytvorenie Payment Intent API route
```
src/app/api/payments/create-intent/route.ts
```

### 4. Stripe Checkout alebo Elements
- Odporúča sa Stripe Checkout pre jednoduchosť
- Alternatíva: Stripe Elements pre vlastný UI

### 5. Webhook pre potvrdenie platby
```
src/app/api/payments/webhook/route.ts
```

### 6. Aktualizácia stavu platby
Po potvrdení platby cez webhook:
- Zmeniť `paymentStatus` z `pending` na `paid`
- Poslať notifikáciu prevádzke o zaplatenej objednávke

## Bezpečnostné poznámky

- **Nikdy** neukladajte celé čísla kariet v databáze
- Stripe tokenizuje kartové údaje – vaša aplikácia dostáva len token
- Všetky platobné komunikácie musia prebiehať cez HTTPS
- Webhook endpointy musia overovať Stripe signatúru
- V produkcií používajte `STRIPE_PUBLIC_KEY=pk_live_...` a `STRIPE_SECRET_KEY=sk_live_...`

## Testovanie platieb

Pre lokálne testovanie Stripe:
1. Vytvorte Stripe test účet na https://stripe.com
2. Použite test karty:
   - Úspešná platba: `4242 4242 4242 4242`
   - Zamietnutá platba: `4000 0000 0000 0002`
   - Vyžadujúca autentifikáciu: `4000 0027 6000 3184`
3. Použite ľubovoľný budúci dátum a CVC
