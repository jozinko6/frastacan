'use client'

import { ArrowLeft, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

export default function PrivacyView() {
  const { setView } = useAppStore()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Ochrana osobných údajov</h1>
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
              <Shield className="h-5 w-5 text-primary" />
              1. Úvod
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              1.1. Prevádzkovateľ platformy Fraštačan (ďalej len &quot;prevádzkovateľ&quot;) 
              si váži súkromie používateľov a zaväzuje sa chrániť ich osobné údaje 
              v súlade s Nariadením Európskeho parlamentu a Rady (EÚ) 2016/679 
              o ochrane fyzických osôb pri spracúvaní osobných údajov (ďalej len &quot;GDPR&quot;).
            </p>
            <p>
              1.2. Tento dokument informuje o tom, aké osobné údaje zhromažďujeme, 
              za akým účelom, ako ich spracúvame a aké máte práva v súvislosti 
              s ochranou vašich osobných údajov.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              2. Zhromažďované osobné údaje
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>2.1. Pri registrácii a používaní platformy zhromažďujeme nasledujúce údaje:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Identifikačné údaje:</strong> meno a priezvisko</li>
              <li><strong>Kontaktné údaje:</strong> e-mailová adresa, telefónne číslo</li>
              <li><strong>Doručovacia adresa:</strong> ulica, číslo, mesto, PSČ</li>
              <li><strong>Údaje o objednávkach:</strong> história objednávok, preferencie</li>
              <li><strong>Platobné údaje:</strong> spôsob platby (neukladáme údaje platobných kariet)</li>
              <li><strong>Technické údaje:</strong> IP adresa, typ zariadenia, prehliadač</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              3. Účel spracúvania osobných údajov
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>3.1. Osobné údaje spracúvame za nasledujúcich účelov:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Správa účtu:</strong> registrácia, prihlasovanie, správa profilu</li>
              <li><strong>Spracovanie objednávok:</strong> prijímanie, spracovanie a doručovanie objednávok</li>
              <li><strong>Komunikácia:</strong> potvrdzovanie objednávok, informovanie o stave doručenia</li>
              <li><strong>Zlepšovanie služieb:</strong> analýza používania, optimalizácia platformy</li>
              <li><strong>Právne povinnosti:</strong> fakturácia, účtovníctvo, ochrana pred podvodmi</li>
              <li><strong>Marketing:</strong> informovanie o novinkách a ponukách (len so súhlasom)</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              4. Cookies
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              4.1. Platforma Fraštačan používa cookies na zabezpečenie správneho fungovania, 
              analytiku a zlepšovanie používateľského zážitku.
            </p>
            <p>4.2. Typy cookies, ktoré používame:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Nevyhnutné cookies:</strong> potrebné pre fungovanie platformy (relácia, prihlásenie)</li>
              <li><strong>Analytické cookies:</strong> anonymné štatistiky o používaní platformy</li>
              <li><strong>Marketingové cookies:</strong> personalizácia obsahu a reklám (len so súhlasom)</li>
            </ul>
            <p>
              4.3. Používateľ môže kedykoľvek spravovať svoje preferencie cookies v nastaveniach prehliadača.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              5. Zdieľanie údajov
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>5.1. Osobné údaje zdieľame len v nevyhnutnom rozsahu s:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Prevádzkami:</strong> meno, doručovacia adresa, telefónne číslo (na účel doručenia)</li>
              <li><strong>Kuriérmi:</strong> doručovacia adresa, telefónne číslo (na účel doručenia)</li>
              <li><strong>Platobnými poskytovateľmi:</strong> údaje potrebné na spracovanie platby</li>
            </ul>
            <p>
              5.2. Osobné údaje nepredávame tretím stranám na marketingové účely.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              6. Vaše práva
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>6.1. V súlade s GDPR máte nasledujúce práva:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Právo na prístup:</strong> máte právo získať informácie o svojich spracúvaných údajoch</li>
              <li><strong>Právo na opravu:</strong> máte právo požadovať opravu nepresných údajov</li>
              <li><strong>Právo na vymazanie:</strong> máte právo požadovať vymazanie svojich údajov</li>
              <li><strong>Právo na obmedzenie:</strong> máte právo požadovať obmedzenie spracúvania</li>
              <li><strong>Právo na prenosnosť:</strong> máte právo získať svoje údaje v strojovo čitateľnom formáte</li>
              <li><strong>Právo namietať:</strong> máte právo namietať proti spracúvaniu údajov</li>
            </ul>
            <p>
              6.2. Svoje práva môžete uplatniť kontaktovaním prevádzkovateľa na adrese 
              info@frastacan.sk.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              7. Bezpečnosť údajov
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              7.1. Prevádzkovateľ prijal primerané technické a organizačné opatrenia na ochranu 
              osobných údajov pred neoprávneným prístupom, stratou, zničením alebo zmenou.
            </p>
            <p>
              7.2. Komunikácia medzi vašim zariadením a našimi servermi je šifrovaná pomocou 
              protokolu HTTPS/TLS.
            </p>
            <p>
              7.3. Prístup k osobným údajom je obmedzený len na oprávnených zamestnancov 
              a spolupracovníkov.
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              8. Uchovávanie údajov
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              8.1. Osobné údaje uchovávame len po dobu nevyhnutnú na účel, pre ktorý boli 
              zhromaždené, alebo po dobu vyžadovanú právnymi predpismi.
            </p>
            <p>
              8.2. Údaje o objednávkach sú uchovávané minimálne po dobu 5 rokov 
              v súlade s účtovnými a daňovými predpismi.
            </p>
            <p>
              8.3. Po uplynutí lehoty uchovávania sú osobné údaje bezpečne vymazané.
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
