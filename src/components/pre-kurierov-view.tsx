'use client'

import { ArrowLeft, Bike, CheckCircle2, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import { useState } from 'react'
import { deliveryZones } from '@/lib/utils-shared'

export default function PreKurierovView() {
  const { setView } = useAppStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error('Vyplňte prosím všetky povinné údaje')
      return
    }
    setSubmitted(true)
    toast.success('Ďakujeme za záujem! Čoskoro sa ozveme.')
  }

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Ďakujeme za záujem!</h2>
        <p className="text-muted-foreground mb-6">
          Vaša prihláška bola odoslaná. Ozveme sa vám do 24 hodín.
        </p>
        <Button
          className="bg-[#B42318] hover:bg-[#9a1f16] text-white"
          onClick={() => setView('home')}
        >
          Späť na domovskú stránku
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Staň sa kuriérom</h1>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Bike className="h-10 w-10 text-[#B42318] shrink-0" />
            <div>
              <h2 className="text-lg font-bold mb-2">Prečo doručovať s Fraštačanom?</h2>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>✅ Flexibilný rozvrh – doručuj, kedy chceš</li>
                <li>✅ Férové odmeňovanie za doručenie</li>
                <li>✅ Lokálne trasy v Hlohovci a okolí</li>
                <li>✅ Podpora slovenského tímu</li>
              </ul>
              <div className="flex flex-wrap gap-2 mt-3">
                {deliveryZones.map((z) => (
                  <span key={z.name} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full border border-blue-200">
                    <MapPin className="h-3 w-3" /> {z.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Prihláste sa ako kuriér</h3>
            <div className="space-y-2">
              <Label htmlFor="name">Meno a priezvisko *</Label>
              <Input
                id="name"
                placeholder="Ján Novák"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@email.sk"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefón *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="+421 9XX XXX XXX"
                    className="pl-10"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">Mesto doručovania</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="city"
                    placeholder="napr. Hlohovec"
                    className="pl-10"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle">Typ vozidla</Label>
                <Input
                  id="vehicle"
                  placeholder="napr. bicykel, motorka, auto"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                />
              </div>
            </div>
            <Button
              className="w-full bg-[#B42318] hover:bg-[#9a1f16] text-white h-12 text-base font-semibold"
              onClick={handleSubmit}
            >
              Odoslať prihlášku
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
