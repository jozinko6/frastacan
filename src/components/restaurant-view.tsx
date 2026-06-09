'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Star, Clock, MapPin, Plus, Minus, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Restaurant, type FoodItem } from '@/lib/store'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

export default function RestaurantView() {
  const { selectedRestaurantId, setView, addToCart, cart, user } = useAppStore()
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [popularItems, setPopularItems] = useState<FoodItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchRestaurant()
    }
  }, [selectedRestaurantId])

  async function fetchRestaurant() {
    try {
      setLoading(true)
      const res = await fetch(`/api/restaurants/${selectedRestaurantId}`)
      if (res.ok) {
        const data = await res.json()
        setRestaurant(data.restaurant)
        setPopularItems(data.popularItems || [])
        if (data.restaurant.categories?.length) {
          setActiveCategory(data.restaurant.categories[0].id)
        }
      }
    } catch (err) {
      console.error('Error fetching restaurant:', err)
    } finally {
      setLoading(false)
    }
  }

  function getQuantity(foodItemId: string): number {
    const cartItem = cart.find((c) => c.foodItem.id === foodItemId)
    return cartItem?.quantity || 0
  }

  function handleAdd(item: FoodItem) {
    if (!restaurant) return
    addToCart(item, restaurant.id, restaurant.name)
  }

  function handleIncrease(item: FoodItem) {
    if (!restaurant) return
    const currentQty = getQuantity(item.id)
    if (currentQty === 0) {
      addToCart(item, restaurant.id, restaurant.name)
    } else {
      useAppStore.getState().updateQuantity(item.id, currentQty + 1)
    }
  }

  function handleDecrease(item: FoodItem) {
    const currentQty = getQuantity(item.id)
    if (currentQty <= 1) {
      useAppStore.getState().removeFromCart(item.id)
      toast.info(`${item.name} odstránené z košíka`)
    } else {
      useAppStore.getState().updateQuantity(item.id, currentQty - 1)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Skeleton className="h-56 w-full rounded-xl mb-6" />
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-32 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-lg text-muted-foreground">Reštaurácia nenájdená</p>
        <Button className="mt-4" onClick={() => setView('home')}>
          Späť na domov
        </Button>
      </div>
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="view-transition">
      {/* Restaurant Header */}
      <div className="relative h-52 sm:h-72 overflow-hidden">
        <img
          src={restaurant.image}
          alt={restaurant.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 hover:bg-white shadow-md"
            onClick={() => setView('home')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-3xl">{restaurant.logo}</span>
              <h1 className="text-2xl sm:text-3xl font-bold">{restaurant.name}</h1>
            </div>
            <p className="text-white/80 text-sm sm:text-base line-clamp-2 mb-3">
              {restaurant.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Star className="h-4 w-4 fill-primary/80 text-primary/80" />
                <span className="font-medium">{restaurant.rating}</span>
                <span className="text-white/70">({restaurant.reviewCount})</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <Clock className="h-4 w-4" />
                <span>{restaurant.deliveryTime}</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
                <MapPin className="h-4 w-4" />
                <span>{restaurant.address}</span>
              </div>
              <Badge variant="secondary" className="bg-primary text-white">
                {restaurant.cuisine}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Popular Items */}
        {popularItems.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg sm:text-xl font-bold mb-4 flex items-center gap-2">
              🔥 Obľúbené položky
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {popularItems.map((item) => {
                const qty = getQuantity(item.id)
                return (
                  <Card key={item.id} className="shrink-0 w-56 border-0 shadow-sm overflow-hidden">
                    {item.image && (
                      <div className="h-28 overflow-hidden bg-primary/5">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                      <p className="text-primary font-bold text-sm mt-1">
                        {item.discountPrice
                          ? <>
                              <span className="line-through text-muted-foreground text-xs mr-1">
                                {formatPrice(item.price)}
                              </span>
                              {formatPrice(item.discountPrice)}
                            </>
                          : formatPrice(item.price)
                        }
                      </p>
                      <div className="mt-2">
                        {qty === 0 ? (
                          <Button
                            size="sm"
                            className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8"
                            onClick={() => handleAdd(item)}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Pridať
                          </Button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 border-primary/60"
                              onClick={() => handleDecrease(item)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="font-bold text-sm w-6 text-center">{qty}</span>
                            <Button
                              size="icon"
                              className="h-8 w-8 bg-primary hover:bg-primary/90 text-white"
                              onClick={() => handleIncrease(item)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Menu Categories */}
        {restaurant.categories && restaurant.categories.length > 0 && (
          <section>
            <h2 className="text-lg sm:text-xl font-bold mb-4">📋 Jedálny lístok</h2>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
              {restaurant.categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  className={`shrink-0 rounded-full text-sm ${activeCategory === cat.id ? 'bg-primary hover:bg-primary/90 text-white' : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.icon && <span className="mr-1">{cat.icon}</span>}
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Food Items */}
            <AnimatePresence mode="wait">
              {restaurant.categories
                .filter((cat) => cat.id === activeCategory)
                .map((cat) => (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    {cat.foodItems.map((item) => {
                      const qty = getQuantity(item.id)
                      return (
                        <Card key={item.id} className="border-0 shadow-sm overflow-hidden">
                          <CardContent className="p-0">
                            <div className="flex">
                              <div className="flex-1 p-4">
                                <div className="flex items-start gap-2">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">{item.name}</h4>
                                      {item.isPopular && (
                                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                                          Populárne
                                        </Badge>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {item.description}
                                      </p>
                                    )}
                                    <div className="mt-2">
                                      {item.discountPrice ? (
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-primary">
                                            {formatPrice(item.discountPrice)}
                                          </span>
                                          <span className="text-sm text-muted-foreground line-through">
                                            {formatPrice(item.price)}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="font-bold text-primary">
                                          {formatPrice(item.price)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3">
                                  {qty === 0 ? (
                                    <Button
                                      size="sm"
                                      className="bg-primary hover:bg-primary/90 text-white"
                                      onClick={() => handleAdd(item)}
                                    >
                                      <Plus className="h-4 w-4 mr-1" /> Pridať
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-9 w-9 border-primary/60"
                                        onClick={() => handleDecrease(item)}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </Button>
                                      <span className="font-bold w-8 text-center">{qty}</span>
                                      <Button
                                        size="icon"
                                        className="h-9 w-9 bg-primary hover:bg-primary/90 text-white"
                                        onClick={() => handleIncrease(item)}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {item.image && (
                                <div className="w-28 sm:w-36 shrink-0 bg-primary/5">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    {cat.foodItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Žiadne položky v tejto kategórii
                      </p>
                    )}
                  </motion.div>
                ))}
            </AnimatePresence>
          </section>
        )}
      </div>

      {/* Floating Cart Bar */}
      {cartTotal > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4"
        >
          <div className="max-w-6xl mx-auto">
            <Button
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-semibold text-base shadow-xl rounded-xl"
              onClick={() => setView('cart')}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Košík ({cartTotal} položiek) - {formatPrice(cart.reduce((sum, i) => sum + (i.foodItem.discountPrice ?? i.foodItem.price) * i.quantity, 0))}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
