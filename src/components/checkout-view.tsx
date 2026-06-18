'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, CreditCard, Banknote, CheckCircle2, Loader2, Truck, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAppStore } from '@/lib/store'
import { formatPrice, deliveryZones, authFetchOrLogout } from '@/lib/utils-shared'
import { toast } from 'sonner'

const validCities = deliveryZones.map((z) => z.name)

export default function CheckoutView() {
  const { cart, cartRestaurantId, cartRestaurantName, user, setView, clearCart, setSelectedOrder } = useAppStore()
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [floorDoor, setFloorDoor] = useState('')
  const [riderNote, setRiderNote] = useState('')
  const [restaurantNote, setRestaurantNote] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [deliveryType, setDeliveryType] = useState('delivery')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; street: string; city: string; postalCode?: string; isDefault: boolean }[]>([])

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.foodItem.discountPrice ?? item.foodItem.price) * item.quantity,
    0
  )

  const selectedZone = useMemo(() => {
    return deliveryZones.find((z) => z.name === city)
  }, [city])

  const deliveryFee = deliveryType === 'pickup' ? 0 : (selectedZone?.fee ?? 2.90)
  const total = subtotal + deliveryFee

  const isCityValid = city.trim() === '' || validCities.includes(city.trim())
  const estimatedMin = selectedZone?.estimatedMin ?? 35
  const estimatedMax = selectedZone?.estimatedMax ?? 60

  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  async function fetchAddresses() {
    try {
      const res = await fetch(`/api/addresses?userId=${user!.id}`)
      if (res.ok) {
        const data = await res.json()
        setSavedAddresses(data.addresses)
        const defaultAddr = data.addresses.find((a: { isDefault: boolean }) => a.isDefault)
        if (defaultAddr) {
          setAddress(defaultAddr.street)
          setCity(defaultAddr.city)
          if (defaultAddr.postalCode) setPostalCode(defaultAddr.postalCode)
        }
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    }
  }

  async function placeOrder() {
    if (!user) {
      toast.error('Prosím, prihláste sa')
      setView('login')
      return
    }
    if (deliveryType === 'delivery' && !address.trim()) {
      toast.error('Zadajte doručovaciu adresu')
      return
    }
    if (deliveryType === 'delivery' && !city.trim()) {
      toast.error('Vyberte mesto/oblasť')
      return
    }
    if (deliveryType === 'delivery' && !isCityValid) {
      toast.error('Do tejto oblasti zatiaľ Fraštačan nedoručuje')
      return
    }
    if (!cartRestaurantId || cart.length === 0) {
      toast.error('Košík je prázdny')
      return
    }
    // Check minimum order for zone
    if (deliveryType === 'delivery' && selectedZone && subtotal < selectedZone.minOrder) {
      toast.error(`Minimálna objednávka pre ${selectedZone.name} je ${formatPrice(selectedZone.minOrder)}`)
      return
    }

    try {
      setSubmitting(true)
      const res = await authFetchOrLogout('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: cartRestaurantId,
          items: cart.map((item) => ({
            foodItemId: item.foodItem.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
          deliveryAddress: deliveryType === 'pickup' ? 'Osobný odber' : `${address}, ${city}${postalCode ? `, ${postalCode}` : ''}`,
          deliveryType,
          city: deliveryType === 'pickup' ? undefined : city,
          paymentMethod,
          notes: restaurantNote || undefined,
          riderNote: riderNote || undefined,
          restaurantNote: restaurantNote || undefined,
          deliveryFee,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setOrderNumber(data.order.orderNumber)
        setSelectedOrder(data.order.id)
        setOrderSuccess(true)
        clearCart()
        toast.success('Objednávka bola vytvorená!')
      } else {
        toast.error(data.error || 'Chyba pri vytváraní objednávky')
      }
    } catch {
      toast.error('Chyba pri vytváraní objednávky')
    } finally {
      setSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="view-transition max-w-lg mx-auto px-4 py-12 text-center safe-area-x">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-2xl font-bold mb-2">Objednávka vytvorená! 🎉</h2>
        <p className="text-muted-foreground mb-2">
          Vaša objednávka bola úspešne odoslaná.
        </p>
        <p className="text-lg font-semibold text-primary mb-6">
          Číslo objednávky: {orderNumber}
        </p>
        <div className="space-y-3">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white h-12"
            onClick={() => setView('order-detail')}
          >
            Zobraziť detail objednávky
          </Button>
          <Button
            variant="outline"
            className="w-full border-primary/40 text-primary hover:bg-primary/5 h-12"
            onClick={() => setView('orders')}
          >
            Moje objednávky
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground hover:bg-muted/60 h-12"
            onClick={() => setView('home')}
          >
            Pokračovať v nákupe
          </Button>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center safe-area-x">
        <p className="text-lg text-muted-foreground">Váš košík je prázdny</p>
        <Button className="mt-4 bg-primary hover:bg-primary/90 text-white" onClick={() => setView('home')}>
          Objednať si jedlo
        </Button>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-6xl mx-auto px-4 py-6 safe-area-x pb-28 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-muted/60" onClick={() => setView('cart')} aria-label="Späť">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Objednávka</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Delivery, Address & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Type */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Spôsob prevzatia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={deliveryType}
                onValueChange={setDeliveryType}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-red-50/50 transition-colors ${deliveryType === 'delivery' ? 'border-primary bg-red-50/30' : ''}`}>
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Truck className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">Doručenie</p>
                      <p className="text-sm text-muted-foreground">Štandardné doručenie</p>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-red-50/50 transition-colors ${deliveryType === 'pickup' ? 'border-primary bg-red-50/30' : ''}`}>
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Store className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium">Osobný odber</p>
                      <p className="text-sm text-muted-foreground">Vyzdvihnete si sami</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {deliveryType === 'delivery' && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Doručovacia adresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {savedAddresses.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">Uložené adresy</Label>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((addr) => (
                        <Button
                          key={addr.id}
                          variant={address === addr.street ? 'default' : 'outline'}
                          size="sm"
                          className={
                            address === addr.street
                              ? 'bg-primary hover:bg-primary/90 text-white'
                              : ''
                          }
                          onClick={() => {
                            setAddress(addr.street)
                            setCity(addr.city)
                            if (addr.postalCode) setPostalCode(addr.postalCode)
                          }}
                        >
                          {addr.label}: {addr.street}
                        </Button>
                      ))}
                    </div>
                    <Separator className="my-3" />
                  </div>
                )}

                {/* City/Area dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="city">Mesto/oblasť *</Label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Vyber mesto/oblasť</option>
                    {validCities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {city && !isCityValid && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertDescription>
                        Do tejto oblasti zatiaľ Fraštačan nedoručuje. Skúste, prosím, Hlohovec, Šulekovo, Leopoldov alebo Červeník.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Ulica a číslo *</Label>
                  <Input
                    id="address"
                    placeholder="napr. Hlavná 25"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">PSČ</Label>
                    <Input
                      id="postalCode"
                      placeholder="napr. 920 01"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floorDoor">Poschodie/vchod</Label>
                    <Input
                      id="floorDoor"
                      placeholder="napr. 3. poschodie / vchod B"
                      value={floorDoor}
                      onChange={(e) => setFloorDoor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riderNote">Poznámka pre kuriéra</Label>
                  <Input
                    id="riderNote"
                    placeholder="napr. Zvonček nefunguje, zavolajte..."
                    value={riderNote}
                    onChange={(e) => setRiderNote(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantNote">Poznámka pre prevádzku</Label>
                  <Input
                    id="restaurantNote"
                    placeholder="napr. Bez cibule, extra omáčka..."
                    value={restaurantNote}
                    onChange={(e) => setRestaurantNote(e.target.value)}
                  />
                </div>

                {/* Delivery estimate */}
                {selectedZone && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                    <Truck className="h-4 w-4 shrink-0" />
                    <span>Odhad doručenia: {estimatedMin}-{estimatedMax} min</span>
                    <span className="text-green-500 mx-1">·</span>
                    <span>Doručovné: {formatPrice(deliveryFee)}</span>
                  </div>
                )}

                {/* Minimum order warning */}
                {selectedZone && subtotal < selectedZone.minOrder && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
                    <span>Minimálna objednávka pre {selectedZone.name}: {formatPrice(selectedZone.minOrder)}</span>
                    <span className="text-amber-500 mx-1">·</span>
                    <span>Chýba: {formatPrice(selectedZone.minOrder - subtotal)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payment Method */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Spôsob platby
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-red-50/50 transition-colors ${paymentMethod === 'card' ? 'border-primary bg-red-50/30' : ''}`}>
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Platba kartou vopred</p>
                      <p className="text-sm text-muted-foreground">Bezpečná online platba kartou pred doručením objednávky.</p>
                    </div>
                  </Label>
                </div>
                <div className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-red-50/50 transition-colors ${paymentMethod === 'cash' ? 'border-primary bg-red-50/30' : ''}`}>
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Hotovosť pri prevzatí</p>
                      <p className="text-sm text-muted-foreground">Zaplatíte kuriérovi alebo prevádzke pri prevzatí objednávky.</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="border-0 shadow-sm lg:sticky lg:top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Zhrnutie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartRestaurantName && (
                <p className="text-sm font-medium truncate">{cartRestaurantName}</p>
              )}

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.foodItem.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.quantity}x {item.foodItem.name}
                    </span>
                    <span>
                      {formatPrice((item.foodItem.discountPrice ?? item.foodItem.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medzisúčet</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {deliveryType === 'pickup' ? 'Osobný odber' : 'Doručovné'}
                  </span>
                  <span>{deliveryType === 'pickup' ? 'Zadarmo' : formatPrice(deliveryFee)}</span>
                </div>
                {deliveryType === 'delivery' && selectedZone && (
                  <div className="text-xs text-muted-foreground">
                    Doručenie do {selectedZone.name} ({estimatedMin}-{estimatedMax} min)
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Celkom</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold hidden lg:flex"
                onClick={placeOrder}
                disabled={submitting || (deliveryType === 'delivery' && (!address.trim() || !city.trim()))}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Odosiela sa...
                  </>
                ) : (
                  'Objednať'
                )}
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Pre objednanie sa musíte{' '}
                  <button
                    className="text-primary underline"
                    onClick={() => setView('login')}
                  >
                    prihlásiť
                  </button>
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile sticky checkout button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t mobile-bottom-safe">
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
          onClick={placeOrder}
          disabled={submitting || (deliveryType === 'delivery' && (!address.trim() || !city.trim()))}
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Odosiela sa...
            </>
          ) : (
            <>Objednať · {formatPrice(total)}</>
          )}
        </Button>
      </div>
    </div>
  )
}
