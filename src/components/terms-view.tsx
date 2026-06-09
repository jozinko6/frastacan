'use client'

import { ArrowLeft, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

export default function TermsView() {
  const { setView } = useAppStore()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Obchodné podmienky</h1>
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
              <FileText className="h-5 w-5 text-primary" />
              1. Všeobecné ustanovenia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              1.1. Tieto obchodné podmienky (ďalej len &quot;podmienky&quot;) upravujú vzťahy medzi prevádzkovateľom 
              platformy Fraštačan (ďalej len &quot;prevádzkovateľ&quot;) a používateľmi tejto platformy 
              (ďalej len &quot;používateľ&quot;) pri objednávaní a doručovaní tovaru a služieb.
            </p>
            <p>
              1.2. Fraštačan je online platforma, ktorá prepája lokálne prevádzky (reštaurácie, kaviarne, 
              kvetinárstva, obchody) so zákazníkmi a zabezpečuje doručenie v regióne Hlohovec a okolie.
            </p>
            <p>
              1.3. Prevádzkovateľ pôsobí ako sprostredkovateľ medzi prevádzkami a zákazníkmi. 
              Za kvalitu a bezpečnosť dodaného tovaru zodpovedá príslušná prevádzka.
            </p>
            <p>
              1.4. Platforma je dostupná na webovej adrese frastacan.sk a prostredníctvom mobilnej aplikácie.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              2. Registrácia a účet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              2.1. Na objednávanie prostredníctvom platformy je potrebná registrácia a vytvorenie 
              používateľského účtu.
            </p>
            <p>
              2.2. Pri registrácii je používateľ povinný uviesť pravdivé a úplné údaje, najmä: 
              meno a priezvisko, e-mailovú adresu, telefónne číslo a doručovaciu adresu.
            </p>
            <p>
              2.3. Používateľ je zodpovedný za dodržiavanie bezpečnosti svojho účtu a prístupových údajov. 
              V prípade podozrenia na zneužitie účtu je používateľ povinný túto skutočnosť bezodkladne oznámiť prevádzkovateľovi.
            </p>
            <p>
              2.4. Prevádzkovateľ si vyhradzuje právo zrušiť účet používateľa v prípade porušenia 
              týchto podmienok alebo zneužitia platformy.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              3. Objednávanie
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              3.1. Objednávku je možné vytvoriť prostredníctvom webovej aplikácie alebo mobilnej aplikácie Fraštačan.
            </p>
            <p>
              3.2. Pri objednávke používateľ vyberie prevádzku, položky z ponuky, doručovaciu adresu 
              a spôsob platby.
            </p>
            <p>
              3.3. Odoslaním objednávky používateľ potvrdzuje, že súhlasí s týmito obchodnými podmienkami.
            </p>
            <p>
              3.4. Potvrdenie prijatia objednávky je zaslané používateľovi prostredníctvom aplikácie 
              a/alebo e-mailom.
            </p>
            <p>
              3.5. Prevádzkovateľ alebo prevádzka si vyhradzuje právo odmietnuť objednávku z objektívnych 
              dôvodov (nedostupnosť tovaru, technické problémy, neprekročenie minimálnej sumy objednávky).
            </p>
            <p>
              3.6. Stav objednávky je možné sledovať v aplikácii v časti &quot;Moje objednávky&quot;.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              4. Platobné podmienky
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>4.1. Platforma Fraštačan ponúka nasledujúce spôsoby platby:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Platba kartou vopred</strong> – online platba kartou Visa/Mastercard cez 
                zabezpečený platobný systém. Prostriedky sú zašifrované a bezpečné.
              </li>
              <li>
                <strong>Hotovosť pri prevzatí</strong> – platba v hotovosti pri doručení objednávky 
                kuriérom. Pri tomto spôsobe platby môže byť vyžadované presné oznášanie.
              </li>
            </ul>
            <p>
              4.2. Ceny uvádzané v aplikácii sú konečné ceny vrátane DPH. Doručovací poplatok 
              je zobrazený pred dokončením objednávky.
            </p>
            <p>
              4.3. V prípade platby kartou vopred je suma rezervovaná na karte v momente objednávky 
              a strhnutá po potvrdení objednávky prevádzkou.
            </p>
            <p>
              4.4. Pri zrušení objednávky prevádzkou je platba vrátená na pôvodný platobný prostriedok 
              v lehote do 5 pracovných dní.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              5. Doručenie
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              5.1. Doručovacia služba Fraštačan je dostupná v nasledujúcich lokalitách:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Hlohovec</strong></li>
              <li><strong>Šulekovo</strong></li>
              <li><strong>Leopoldov</strong></li>
              <li><strong>Červeník</strong></li>
            </ul>
            <p>
              5.2. Predpokladaný čas doručenia je uvedený v aplikácii pri objednávke a závisí 
              od vzdialenosti, objemu objednávok a otváracích hodín prevádzky.
            </p>
            <p>
              5.3. Doručovací poplatok sa vypočíta na základe doručovacej zóny a je zobrazený 
              pred dokončením objednávky.
            </p>
            <p>
              5.4. Kuriér doručí objednávku na uvedenú adresu. Pri doručení je potrebné 
              prevziať objednávku a potvrdiť prevzatie v aplikácii.
            </p>
            <p>
              5.5. V prípade nedostupnosti zákazníka na doručovacej adrese sa kuriér pokúsi 
              o kontaktovanie na uvedenom telefónnom čísle. Ak sa zákazníka nepodarí kontaktovať, 
              objednávka môže byť vrátená prevádzke.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              6. Reklamácie
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              6.1. V prípade nespokojnosti s objednávkou môže používateľ uplatniť reklamáciu 
              prostredníctvom aplikácie alebo na e-mailovej adrese info@frastacan.sk.
            </p>
            <p>
              6.2. Reklamáciu je možné uplatniť najneskôr do 24 hodín od doručenia objednávky.
            </p>
            <p>
              6.3. Pri reklamácii je potrebné uviesť číslo objednávky, dôvod reklamácie a prípadne 
              priložiť fotografie dokazujúce vadu alebo problém.
            </p>
            <p>
              6.4. Prevádzkovateľ sa vyjadrí k reklamácii do 3 pracovných dní. V oprávnenej 
              reklamácii môže byť poskytnutá náhrada vo forme vrátenia peňazí, zľavy na ďalšiu 
              objednávku alebo opakovaného doručenia.
            </p>
            <p>
              6.5. Podrobnejšie informácie o reklamčiom konaní nájdete v Reklamačnom poriadku.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              7. Ochrana osobných údajov
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              7.1. Spracúvanie osobných údajov sa riadi platnými právnymi predpismi SR a EÚ, 
              najmä Nariadením GDPR (všeobecné nariadenie o ochrane údajov).
            </p>
            <p>
              7.2. Podrobné informácie o spracúvaní osobných údajov nájdete v dokumente 
              &quot;Ochrana osobných údajov&quot;.
            </p>
            <p>
              7.3. Používateľ má právo prístupu k svojim osobným údajom, právo na ich opravu, 
              vymazanie alebo obmedzenie spracúvania.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              8. Záverečné ustanovenia
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              8.1. Tieto obchodné podmienky nadobúdajú účinnosť dňom ich zverejnenia na webovej 
              stránke frastacan.sk.
            </p>
            <p>
              8.2. Prevádzkovateľ si vyhradzuje právo kedykoľvek zmeniť tieto obchodné podmienky. 
              Zmenené podmienky nadobúdajú účinnosť dňom ich zverejnenia.
            </p>
            <p>
              8.3. Na vzťahy nevysvetlené týmito podmienkami sa vzťahujú príslušné ustanovenia 
              Občianskeho zákonníka a Zákona o ochrane spotrebiteľa.
            </p>
            <p>
              8.4. V prípade sporov sa príslušnosť riadi všeobecnými predpismi o súdnej 
              príslušnosti.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Kontaktné údaje prevádzkovateľa</h3>
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
