'use client'

import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

export default function ComplaintsView() {
  const { setView } = useAppStore()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Reklamačný poriadok</h1>
          <p className="text-sm text-amber-600 font-medium mt-0.5">
            Pracovný návrh – nie je právne finálny
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-amber-800">
          <strong>Upozornenie:</strong> Tento dokument je pracovný návrh a nemá právnu záväznosť. 
          Finálna verzia bude zverejnená po právnom preskúmaní a schválení.
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              1. Všeobecné ustanovenia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              1.1. Tento reklamačný poriadok upravuje podmienky a postup pri uplatňovaní 
              reklamácií na tovar a služby dodávané prostredníctvom platformy Fraštačan.
            </p>
            <p>
              1.2. Reklamáciu môže uplatniť zákazník, ktorý uzavrel kúpnu zmluvu prostredníctvom 
              platformy Fraštačan a bol mu doručený tovar alebo služba.
            </p>
            <p>
              1.3. Reklamačný poriadok je v súlade s Občianskym zákonníkom, Zákonom o ochrane 
              spotrebiteľa a ďalšími právnymi predpismi Slovenskej republiky.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              2. Dôvody na reklamáciu
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>2.1. Zákazník má právo uplatniť reklamáciu najmä v prípadoch:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Doručenie nesprávnej objednávky (iné položky ako boli objednané)</li>
              <li>Nekompletná objednávka (chýbajúce položky)</li>
              <li>Nesprávna cena účtovaná za tovar alebo službu</li>
              <li>Tovar v nezodpovedajúcej kvalite (pokazené jedlo, nesprávna teplota)</li>
              <li>Meškanie doručenia výrazne presahujúce uvedený čas</li>
              <li>Poškodenie tovaru počas prepravy</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              3. Ako uplatniť reklamáciu
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>3.1. Reklamáciu je možné uplatniť nasledujúcimi spôsobmi:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Cez aplikáciu:</strong> v časti &quot;Moje objednávky&quot; vyberte objednávku a kliknite na &quot;Reklamovať&quot;</li>
              <li><strong>E-mailom:</strong> na adresu info@frastacan.sk s uvedením čísla objednávky</li>
            </ul>
            <p>3.2. Pri reklamácii je potrebné uviesť:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Číslo objednávky</li>
              <li>Dátum a čas doručenia</li>
              <li>Konkrétny dôvod reklamácie</li>
              <li>Prípadné fotografie dokazujúce vadu alebo problém</li>
              <li>Navrhovaný spôsob vyriešenia (vrátenie peňazí, opakované doručenie, zľava)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              4. Lehoty na uplatnenie reklamácie
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              4.1. Reklamáciu na kvalitu doručeného tovaru je možné uplatniť najneskôr do 
              <strong> 24 hodín </strong> od doručenia objednávky.
            </p>
            <p>
              4.2. Reklamáciu na nesprávnu objednávku alebo nekompletnosť je možné uplatniť 
              najneskôr do <strong>2 hodín</strong> od doručenia.
            </p>
            <p>
              4.3. Po uplynutí týchto lehôt môže byť reklamácia zamietnutá, pokiaľ 
              zákazník nepreukáže, že oneskorenie bolo spôsobené objektívnymi dôvodmi.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              5. Vybavenie reklamácie
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              5.1. Prevádzkovateľ potvrdí prijatie reklamácie do <strong>24 hodín</strong> 
              a začne s jej vybavovaním.
            </p>
            <p>
              5.2. Reklamácia bude vybavená do <strong>3 pracovných dní</strong> od prijatia, 
              v zložitejších prípadoch do <strong>7 pracovných dní</strong>.
            </p>
            <p>
              5.3. O výsledku reklamácie bude zákazník informovaný prostredníctvom aplikácie 
              alebo e-mailom.
            </p>
            <p>5.4. V prípade oprávnenej reklamácie môže byť poskytnuté:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Vrátenie peňazí na pôvodný platobný prostriedok</li>
              <li>Zľava na nasledujúcu objednávku</li>
              <li>Opakované doručenie opravnenej objednávky bez poplatku</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              6. Odstúpenie od zmluvy
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              6.1. Zákazník má právo odstúpiť od kúpnej zmluvy do <strong>14 dní</strong> od 
              prevzatia tovaru bez uvedenia dôvodu, ak ide o tovar zakúpený na diaľku.
            </p>
            <p>
              6.2. Toto právo sa nevzťahuje na tovar, ktorý bol zhotovený na mieru alebo 
              ktorý podlieha rýchlej skaze (napr. čerstvé jedlo), alebo ktorý bol 
              nezvratne zmiešaný s inými vecami.
            </p>
            <p>
              6.3. Pri odstúpení od zmluvy vráti prevádzkovateľ platbu do <strong>14 dní</strong> 
              od prijatia oznámenia o odstúpení.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              7. Záverečné ustanovenia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              7.1. Tento reklamačný poriadok nadobúda účinnosť dňom jeho zverejnenia 
              na webovej stránke frastacan.sk.
            </p>
            <p>
              7.2. Prevádzkovateľ si vyhradzuje právo kedykoľvek zmeniť tento reklamačný 
              poriadok. Zmenený poriadok nadobúda účinnosť dňom jeho zverejnenia.
            </p>
            <p>
              7.3. V prípade sporu môže zákazník sa obrátiť na príslušný orgán ochrany 
              spotrebiteľa alebo na súd.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Kontaktné údaje pre reklamácie</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Názov:</strong> Fraštačan</p>
              <p><strong>E-mail:</strong> info@frastacan.sk</p>
              <p><strong>Región:</strong> Hlohovec a okolie</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
