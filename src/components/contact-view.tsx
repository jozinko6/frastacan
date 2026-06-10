'use client'

import { ArrowLeft, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAppStore } from '@/lib/store'

export default function ContactView() {
  const { setView } = useAppStore()

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Kontakt</h1>
      </div>

      <div className="space-y-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-lg font-bold">Fraštačan</h2>
                  <p className="text-sm text-muted-foreground">
                    Lokálna platforma pre doručovanie jedla, kávy, kvetov a nákupu z prevádzok 
                    v regióne Hlohovec a okolie.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Názov</p>
                      <p className="text-sm font-medium">Fraštačan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Región</p>
                      <p className="text-sm font-medium">Hlohovec a okolie</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">E-mail</p>
                      <a
                        href="mailto:info@frastacan.sk"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        info@frastacan.sk
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telefón</p>
                      <p className="text-sm font-medium text-muted-foreground italic">doplniť</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Prevádzkovateľ</p>
                      <p className="text-sm font-medium text-muted-foreground italic">doplniť</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Doručovacie zóny</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">Hlohovec</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">Šulekovo</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">Leopoldov</p>
              </div>
              <div className="bg-primary/5 rounded-xl p-3 text-center">
                <MapPin className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-sm font-medium">Červeník</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Otváracie hodiny doručovania</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-muted-foreground">Po - Pi</span>
                <span className="font-medium">10:00 - 22:00</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-muted-foreground">Sobota</span>
                <span className="font-medium">11:00 - 23:00</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-muted-foreground">Nedeľa</span>
                <span className="font-medium">11:00 - 21:00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Spôsoby platby</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">💳</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Platba kartou vopred</p>
                  <p className="text-xs text-muted-foreground">Visa, Mastercard – bezpečná online platba</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <span className="text-lg">💵</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Hotovosť pri prevzatí</p>
                  <p className="text-xs text-muted-foreground">Platba v hotovosti kuriérovi</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
