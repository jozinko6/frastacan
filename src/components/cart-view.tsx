'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useAppStore } from '@/lib/store'
import { useState } from 'react'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

export default function CartView() {
  const { cart, cartRestaurantName, updateQuantity, removeFromCart, clearCart, setView } = useAppStore()
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponValidating, setCouponValidating] = useState(false)

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.foodItem.discountPrice ?? item.foodItem.price) * item.quantity,
    0
  )
  const deliveryFee = subtotal > 0 ? 2.5 : 0
  const total = Math.max(0, subtotal + deliveryFee - couponDiscount)

  async function validateCoupon() {
    if (!couponCode.trim()) return
    try {
      setCouponValidating(true)
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setCouponDiscount(data.discountAmount)
        toast.success(`Kupón aplikovaný! Zľava: ${formatPrice(data.discountAmount)}`)
      } else {
        toast.error(data.error || 'Neplatný kupón')
        setCouponDiscount(0)
      }
    } catch {
      toast.error('Chyba pri overovaní kupónu')
    } finally {
      setCouponValidating(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="view-transition max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold mb-2">Váš košík je prázdny</h2>
          <p className="text-muted-foreground mb-6">
            Pridajte si niečo chutné z našich reštaurácií
          </p>
          <Button
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={() => setView('home')}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Objednať si jedlo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setView('home')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Košík</h1>
          {cartRestaurantName && (
            <p className="text-sm text-muted-foreground">{cartRestaurantName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                key={item.foodItem.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      {item.foodItem.image && (
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 bg-primary/5">
                          <img
                            src={item.foodItem.image}
                            alt={item.foodItem.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base line-clamp-1">
                          {item.foodItem.name}
                        </h3>
                        <p className="text-primary font-bold mt-1">
                          {formatPrice((item.foodItem.discountPrice ?? item.foodItem.price) * item.quantity)}
                        </p>
                        {item.foodItem.discountPrice && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatPrice(item.foodItem.price * item.quantity)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            removeFromCart(item.foodItem.id)
                            toast.info(`${item.foodItem.name} odstránené`)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-primary/60"
                            onClick={() => updateQuantity(item.foodItem.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            size="icon"
                            className="h-8 w-8 bg-primary hover:bg-primary/90 text-white"
                            onClick={() => updateQuantity(item.foodItem.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button
            variant="ghost"
            className="text-destructive hover:text-destructive hover:bg-destructive/5"
            onClick={() => {
              clearCart()
              setCouponDiscount(0)
              toast.info('Košík bol vyčistený')
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Vyčistiť košík
          </Button>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="border-0 shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Zhrnutie objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Medzisúčet</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Doručovné</span>
                  <span>{formatPrice(deliveryFee)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Zľava (kupón)</span>
                    <span>-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Celkom</span>
                  <span className="text-primary">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="flex gap-2">
                <Input
                  placeholder="Kód kupónu"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value)
                    if (couponDiscount > 0) setCouponDiscount(0)
                  }}
                  className="text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={validateCoupon}
                  disabled={couponValidating}
                  className="shrink-0 border-primary/40 text-primary hover:bg-primary/5"
                >
                  <Tag className="h-4 w-4" />
                </Button>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-base font-semibold"
                onClick={() => setView('checkout')}
              >
                Pokračovať k objednávke
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
