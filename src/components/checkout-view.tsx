'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, CreditCard, Banknote, CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

export default function CheckoutView() {
  const { cart, cartRestaurantId, cartRestaurantName, user, setView, clearCart, setSelectedOrder } = useAppStore()
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  const [savedAddresses, setSavedAddresses] = useState<{ id: string; label: string; street: string; city: string; isDefault: boolean }[]>([])

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.foodItem.discountPrice ?? item.foodItem.price) * item.quantity,
    0
  )
  const deliveryFee = 2.5
  const total = subtotal + deliveryFee

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
    if (!address.trim()) {
      toast.error('Zadajte doručovaciu adresu')
      return
    }
    if (!cartRestaurantId || cart.length === 0) {
      toast.error('Košík je prázdny')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: cartRestaurantId,
          items: cart.map((item) => ({
            foodItemId: item.foodItem.id,
            quantity: item.quantity,
            notes: item.notes,
          })),
          deliveryAddress: `${address}, ${city}`,
          paymentMethod,
          notes,
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
      <div className="view-transition max-w-lg mx-auto px-4 py-12 text-center">
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
        <p className="text-lg font-semibold text-orange-600 mb-6">
          Číslo objednávky: {orderNumber}
        </p>
        <div className="space-y-3">
          <Button
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            onClick={() => setView('order-detail')}
          >
            Zobraziť detail objednávky
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setView('orders')}
          >
            Moje objednávky
          </Button>
          <Button
            variant="ghost"
            className="w-full"
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
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">Váš košík je prázdny</p>
        <Button className="mt-4 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setView('home')}>
          Objednať si jedlo
        </Button>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('cart')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Objednávka</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Delivery & Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Delivery Address */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-orange-500" />
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
                            ? 'bg-orange-500 hover:bg-orange-600 text-white'
                            : ''
                        }
                        onClick={() => {
                          setAddress(addr.street)
                          setCity(addr.city)
                        }}
                      >
                        {addr.label}: {addr.street}
                      </Button>
                    ))}
                  </div>
                  <Separator className="my-3" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="address">Ulica a číslo *</Label>
                <Input
                  id="address"
                  placeholder="napr. Hlavná 25"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Mesto *</Label>
                <Input
                  id="city"
                  placeholder="napr. Košice"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Poznámka k objednávke</Label>
                <Input
                  id="notes"
                  placeholder="napr. Zvonček nefunguje, zavolajte..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-orange-500" />
                Spôsob platby
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-orange-50/50 transition-colors">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-3 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Hotovosť</p>
                      <p className="text-sm text-muted-foreground">Platba pri doručení</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-orange-50/50 transition-colors">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Platobná karta</p>
                      <p className="text-sm text-muted-foreground">Online platba kartou</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Zhrnutie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {cartRestaurantName && (
                <p className="text-sm font-medium">{cartRestaurantName}</p>
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
                  <span className="text-muted-foreground">Doručovné</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Celkom</span>
                  <span className="text-orange-600">{formatPrice(total)}</span>
                </div>
              </div>

              <Button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold"
                onClick={placeOrder}
                disabled={submitting || !address.trim()}
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
                    className="text-orange-500 underline"
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
    </div>
  )
}
