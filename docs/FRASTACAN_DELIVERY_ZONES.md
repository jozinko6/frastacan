# Fraštačan – Doručovacie zóny

## Prehľad

Fraštačan podporuje 4 doručovacie zóny v okolí Hlohovca. Každá zóna má vlastný poplatok za doručenie, minimálnu objednávku a odhadovaný čas doručenia. Zóny sú definované v databáze (model `DeliveryZone`) a v klientskom kóde (`src/lib/utils-shared.ts`).

## Konfigurácia zón

### 1. Hlohovec centrum

| Parameter | Hodnota |
|---|---|
| Názov | Hlohovec centrum |
| Typ | municipal |
| Poplatok za doručenie | 1,90 € |
| Minimálna objednávka | 6,00 € |
| Odhadovaný čas | 25–45 min |
| Polomer doručenia | 3 km |
| Stred – zemepisná šírka | 48.4317 |
| Stred – zemepisná dĺžka | 17.8031 |
| Aktívna | Áno |

**Popis:** Centrálna zóna mesta Hlohovec. Zahŕňa historické centrum a najhustejšie obývanú časť mesta. Najnižší poplatok za doručenie a najkratší čas doručenia vďaka blízkosti väčšiny prevádzok.

### 2. Šulekovo

| Parameter | Hodnota |
|---|---|
| Názov | Šulekovo |
| Typ | suburban |
| Poplatok za doručenie | 2,40 € |
| Minimálna objednávka | 8,00 € |
| Odhadovaný čas | 30–50 min |
| Polomer doručenia | 3 km |
| Stred – zemepisná šírka | 48.4215 |
| Stred – zemepisná dĺžka | 17.7900 |
| Aktívna | Áno |

**Popis:** Mestská časť Šulekovo, priľahlá k Hlohovcu. Stredne hustá obývaná oblasť s miernym nárastom času doručenia oproti centru.

### 3. Leopoldov

| Parameter | Hodnota |
|---|---|
| Názov | Leopoldov |
| Typ | suburban |
| Poplatok za doručenie | 2,90 € |
| Minimálna objednávka | 10,00 € |
| Odhadovaný čas | 35–60 min |
| Polomer doručenia | 5 km |
| Stred – zemepisná šírka | 48.4456 |
| Stred – zemepisná dĺžka | 17.7647 |
| Aktívna | Áno |

**Popis:** Samostatné mesto v blízkosti Hlohovca. Väčšia vzdialenosť vyžaduje vyšší poplatok a dlhší čas doručenia. Väčší polomer doručenia (5 km) pokrýva celé mesto.

### 4. Červeník

| Parameter | Hodnota |
|---|---|
| Názov | Červeník |
| Typ | village |
| Poplatok za doručenie | 3,50 € |
| Minimálna objednávka | 12,00 € |
| Odhadovaný čas | 40–70 min |
| Polomer doručenia | 6 km |
| Stred – zemepisná šírka | 48.4586 |
| Stred – zemepisná dĺžka | 17.7996 |
| Aktívna | Áno |

**Popis:** Obec Červeník, najvzdialenejšia doručovacia zóna. Najvyšší poplatok za doručenie a najdlhší odhadovaný čas. Väčší polomer (6 km) zohľadňuje rozptýlenú zástavbu.

## Prehľadová tabuľka

| Zóna | Typ | Poplatok | Min. objednávka | Čas | Polomer |
|---|---|---|---|---|---|
| Hlohovec centrum | municipal | 1,90 € | 6,00 € | 25–45 min | 3 km |
| Šulekovo | suburban | 2,40 € | 8,00 € | 30–50 min | 3 km |
| Leopoldov | suburban | 2,90 € | 10,00 € | 35–60 min | 5 km |
| Červeník | village | 3,50 € | 12,00 € | 40–70 min | 6 km |

## Umiestnenie konfigurácie

### Databáza (Prisma)
Doručovacie zóny sú uložené v tabuľke `DeliveryZone` podľa nasledujúceho schémy:

```prisma
model DeliveryZone {
  id            String    @id @default(cuid())
  name          String
  type          String    @default("municipal") // municipal, suburban, village
  baseFee       Float     @default(0)
  minimumOrder  Float     @default(0)
  estimatedMin  Int       @default(25)
  estimatedMax  Int       @default(45)
  radiusKm      Float     @default(3)
  centerLat     Float
  centerLng     Float
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  restaurants   Restaurant[]
}
```

### Klientsky kód
Zóny sú tiež definované v `src/lib/utils-shared.ts` ako konštanta `deliveryZones` pre rýchly prístup bez API volania:

```typescript
export const deliveryZones = [
  { name: 'Hlohovec', fee: 1.90, minOrder: 6.00, estimatedMin: 25, estimatedMax: 45 },
  { name: 'Šulekovo', fee: 2.40, minOrder: 8.00, estimatedMin: 30, estimatedMax: 50 },
  { name: 'Leopoldov', fee: 2.90, minOrder: 10.00, estimatedMin: 35, estimatedMax: 60 },
  { name: 'Červeník', fee: 3.50, minOrder: 12.00, estimatedMin: 40, estimatedMax: 70 },
]
```

### Seedovanie
Zóny sa vytvárajú pri seedovaní databázy v `prisma/seed.ts`. Pri opätovnom seedovaní sa vytvoria nové záznamy.

## Väzba na prevádzky

Každá prevádzka (Restaurant) má voliteľnú väzbu `zoneId` na doručovaciu zónu. Táto väzba určuje:
- Poplatok za doručenie pre danú prevádzku
- Minimálnu objednávku
- Odhadovaný čas doručenia

Pri objednávke sa zóna určuje podľa adresy doručenia (mesto), nielen podľa zóny prevádzky.

## Validácia pri checkout

V checkout view (`src/components/checkout-view.tsx`) sa vykonáva validácia:
1. Zákazník vyberie mesto doručenia
2. Systém nájde zodpovedajúcu zónu
3. Overí sa minimálna objednávka pre danú zónu
4. Vypočíta sa poplatok za doručenie
5. Zobrazí sa odhadovaný čas doručenia

Ak suma košíka nedosahuje minimálnu objednávku pre zónu, checkout je zablokovaný s upozornením.

## Dôležité poznámky

### Presné hranice zón
Súčasné súradnice predstavujú **približný stred** každej zóny s kruhovým polomerom. Pre produkčné nasadenie sa odporúča:

- **Overiť hranice zón pomocou mapy** – kruhový polomer je len aproximácia; skutočné hranice by mali kopírovať administratívne hranice obcí
- **Pridať polygonové hranice** – model `DeliveryZone` podporuje rozšírenie o pole `polygon` pre presné vymedzenie
- **Otestovať doručovacie časy** – odhadované časy sú konzervatívne; pri reálnej prevádzke ich možno upraviť

### Geolokačná validácia
Momentálne sa zóna určuje podľa názvu mesta (textový výber). Pre presnejšie určenie sa odporúča:
- Integrácia Google Maps API pre geocoding adries
- Výpočet vzdialenosti od prevádzky k adrese doručenia
- Automatické priradenie zóny podľa súradníc

### Rozšírenie zón
Pre pridanie novej doručovacej zóny:
1. Pridajte záznam do databázy (alebo cez admin panel v sekcii Zóny)
2. Pridajte zónu do `deliveryZones` v `src/lib/utils-shared.ts`
3. Overte súradnice a polomer na mape
4. Otestujte checkout s novou zónou
