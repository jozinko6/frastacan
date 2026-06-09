# Fraštačan – Požadovaná konfigurácia backendových služieb

## Prehľad

Tento dokument popisuje všetky externé služby a konfigurácie, ktoré sú potrebné pre plnú funkčnosť aplikácie Fraštačan v produkcii. Bez týchto konfigurácií aplikácia funguje v demo režime s obmedzeniami.

---

## 1. Stripe – Platobná brána

### Účel
Spracovanie platieb kartou vopred. Bez Stripe integrácie je platba kartou len textové označenie – transakcie sa neprocesujú.

### Požiadavky
| Položka | Popis |
|---|---|
| Stripe účet | Vytvoriť na https://stripe.com |
| API kľúče | Verejný a tajný kľúč (test aj live) |
| Webhook endpoint | Pre prijímanie potvrdení o platbách |

### Premenné prostredia
```env
STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx
ENABLE_CARD_PAYMENT=true
```

### Čo je potrebné implementovať
1. **API route pre Payment Intent** – `src/app/api/payments/create-intent/route.ts`
2. **Stripe Checkout alebo Elements** – komponenty v checkout view
3. **Webhook endpoint** – `src/app/api/payments/webhook/route.ts`
4. **Aktualizácia stavu platby** – automatická zmena `paymentStatus` na `paid`
5. **Chybové stavy** – spracovanie zamietnutých platieb

### Testovacie karty Stripe
| Karta | Výsledok |
|---|---|
| `4242 4242 4242 4242` | Úspešná platba |
| `4000 0000 0000 0002` | Zamietnutá platba |
| `4000 0027 6000 3184` | Vyžaduje 3D Secure |

### Odhadovaný čas implementácie
2–3 dni

---

## 2. Google Maps API – Mapová integrácia

### Účel
Zobrazenie máp pre výber adresy, sledovanie kuriéra a vizualizáciu doručovacích zón.

### Požiadavky
| Položka | Popis |
|---|---|
| Google Cloud projekt | Vytvoriť na https://console.cloud.google.com |
| Maps JavaScript API | Pre zobrazovanie máp |
| Places API | Pre autocomplete adries |
| Geocoding API | Pre prevod adresy na súradnice |
| API kľúč | S obmedzeniami na doménu aplikácie |

### Premenné prostredia
```env
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Čo je potrebné implementovať
1. **Mapa v checkout** – interaktívny výber doručovacej adresy
2. **Geocoding** – prevod zadanej adresy na súradnice
3. **Autocomplete** – návrhy adries počas písania
4. **Mapa v kuriérskom paneli** – zobrazenie trasy a polohy
5. **Vizualizácia zón** – zobrazenie doručovacích zón na mape
6. **Výpočet vzdialenosti** – automatické priradenie zóny podľa súradníc

### Odhadovaný čas implementácie
3–5 dní

---

## 3. Firebase Cloud Messaging – Push notifikácie

### Účel
Posielanie push notifikácií zákazníkom (zmena stavu objednávky), kuriérom (nová objednávka) a prevádzkam (nová objednávka).

### Požiadavky
| Položka | Popis |
|---|---|
| Firebase projekt | Vytvoriť na https://console.firebase.google.com |
| Cloud Messaging | Aktivovať FCM |
| Konfiguračné údaje | API kľúč, projekt ID, sender ID |

### Premenné prostredia
```env
FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FIREBASE_PROJECT_ID=frastacan-xxxxx
FIREBASE_SENDER_ID=XXXXXXXXXXXX
```

### Čo je potrebné implementovať
1. **Firebase inicializácia** – v klientskom kóde
2. **Žiadosť o povolenie** – dialog pre push notifikácie
3. **Token registrácia** – uloženie FCM tokenov v databáze
4. **Server-side odosielanie** – API route pre posielanie notifikácií
5. **Service worker update** – spracovanie push udalostí v `sw.js`
6. **Databázový model** – pridanie `fcmToken` do modelu User

### Typy notifikácií
| Príjemca | Udalosť | Priorita |
|---|---|---|
| Zákazník | Objednávka potvrdená | Vysoká |
| Zákazník | Objednávka sa pripravuje | Stredná |
| Zákazník | Kuriér je na ceste | Vysoká |
| Zákazník | Objednávka doručená | Stredná |
| Kuriér | Nová objednávka k dispozícii | Vysoká |
| Prevádzka | Nová objednávka | Vysoká |
| Prevádzka | Zmena stavu objednávky | Stredná |

### Odhadovaný čas implementácie
3–4 dni

---

## 4. SMTP – E-mailové notifikácie

### Účel
Posielanie e-mailov zákazníkom (potvrdenie objednávky, zmena stavu), prevádzkam (nová objednávka) a kuriérom (nová príležitosť).

### Požiadavky
| Položka | Popis |
|---|---|
| SMTP server | Napr. SendGrid, Mailgun, Amazon SES, alebo vlastný |
| Poverenia | Host, port, používateľ, heslo |
| Odosielateľská adresa | Overená doména |

### Premenné prostredia
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=info@frastacan.sk
```

### Čo je potrebné implementovať
1. **E-mailový klient** – utility pre odosielanie e-mailov (napr. nodemailer)
2. **E-mailové šablóny** – HTML šablóny pre jednotlivé typy notifikácií
3. **Integrácia do API** – odosielanie po udalostiach (nová objednávka, zmena stavu)
4. **Odhlásenie (unsubscribe)** – možnosť odhlásenia z notifikácií

### Typy e-mailov
| Príjemca | Typ e-mailu |
|---|---|
| Zákazník | Potvrdenie objednávky |
| Zákazník | Zmena stavu objednávky |
| Zákazník | Faktúra/doklad o platbe |
| Prevádzka | Nová objednávka |
| Kuriér | Nová príležitosť na doručenie |
| Všetci | Overenie e-mailu pri registrácii |

### Odporúčané služby
| Služba | Výhody |
|---|---|
| SendGrid | 100 e-mailov/deň zdarma, dobré doručenie |
| Mailgun | Flexibilné API, dobré pre transakčné e-maily |
| Amazon SES | Najnižšia cena, vyžaduje AWS účet |
| Resend | Moderné API, 100 e-mailov/deň zdarma |

### Odhadovaný čas implementácie
2–3 dni

---

## 5. Produkčné tajomstvá – Autentifikácia

### Účel
Bezpečné hodnoty pre hashovanie hesiel a podpisovanie session tokenov. Aktuálne použité hodnoty (`frastacan-salt` a `frastacan-secret-key-2024`) sú hardcoded a nie sú bezpečné pre produkciu.

### Požiadavky
| Položka | Popis |
|---|---|
| AUTH_SALT | Náhodný reťazec, minimálne 32 znakov |
| TOKEN_SECRET | Náhodný reťazec, minimálne 64 znakov |

### Premenné prostredia
```env
AUTH_SALT=<silný-náhodný-reťazec-32+-znakov>
TOKEN_SECRET=<silný-náhodný-reťazec-64+-znakov>
```

### Ako vygenerovať
```bash
# Pre AUTH_SALT (32+ znakov)
openssl rand -base64 32

# Pre TOKEN_SECRET (64+ znakov)
openssl rand -base64 64
```

### Dôležité poznámky
- **Po zmene AUTH_SALT** budú existujúce heslá nefunkčné – všetci používatelia musia resetovať heslo
- **Po zmene TOKEN_SECRET** budú existujúce sessions neplatné – všetci používatelia sa musia prihlásiť znova
- Tieto hodnoty **nikdy** neukladajte do Git repozitára
- V produkcii zvážte použitie secrets managera (napr. AWS Secrets Manager, HashiCorp Vault)

### Odhadovaný čas implementácie
1 hodina

---

## 6. Reálne doručovacie zóny – Polygonové hranice

### Účel
Presné ohraničenie doručovacích zón namiesto kruhového polomeru. Súčasné kruhové hranice sú aproximácia.

### Požiadavky
| Položka | Popis |
|---|---|
| Google Maps alebo iný nástroj | Na vizuálne vymedzenie zón |
| Súradnice polygonu | Sada súradníc pre každou zónu |
| Databázový model | Rozšírenie DeliveryZone o pole `polygon` |

### Čo je potrebné implementovať
1. **Rozšírenie modelu** – pridať pole `polygon` (JSON) do `DeliveryZone`
2. **Overenie hraníc** – vizuálne overiť hranice na mape
3. **Admin nástroj** – editor zón na mape v admin paneli
4. **Geofencing** – kontrola, či bod leží v polygone
5. **Migrácia** – aktualizácia existujúcich zón

### Odhadovaný čas implementácie
2–3 dni

---

## 7. Reálne obchodné dáta

### Účel
Nahradenie demo dát reálnymi informáciami o prevádzkach a produktoch.

### Požiadavky
- Skutočné názvy a adresy prevádzok
- Reálne obrázky (nie Unsplash placeholder)
- Skutočné ceny a menu
- Reálne otváracie hodiny
- Kontaktne informácie

### Odhadovaný čas implementácie
Prebieha kontinuálne pri onboarding prevádzok

---

## Súhrn priorít

| Priorita | Služba | Dôvod |
|---|---|---|
| Kritická | Produkčné tajomstvá | Bezpečnosť |
| Vysoká | Stripe | Platenie je kľúčové pre biznis |
| Vysoká | Google Maps | Používateľský zážitok |
| Stredná | SMTP | Notifikácie zlepšujú retenciu |
| Stredná | Firebase Push | Real-time notifikácie |
| Nízka | Polygonové zóny | Presnosť doručenia |
| Priebežná | Reálne dáta | Obsah aplikácie |

## Celkový odhadovaný čas

| Služba | Čas |
|---|---|
| Produkčné tajomstvá | 1 hodina |
| Stripe integrácia | 2–3 dni |
| Google Maps integrácia | 3–5 dní |
| Firebase push notifikácie | 3–4 dni |
| SMTP e-maily | 2–3 dni |
| Polygonové zóny | 2–3 dni |
| **Celkom** | **12–19 dní** |
