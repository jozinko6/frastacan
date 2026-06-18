'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, Star, MapPin, Store, Bike, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Restaurant } from '@/lib/store'
import { formatPrice, cuisineOptions, deliveryZones } from '@/lib/utils-shared'

const mainCategories = cuisineOptions.slice(0, 8) // Pizza through Pekárne

export default function HomeView() {
  const { setView, setSelectedRestaurant, searchQuery, setSearchQuery } = useAppStore()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const restaurantGridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    let result = restaurants
    if (selectedCuisine) {
      result = result.filter((r) => r.cuisine.includes(selectedCuisine))
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      )
    }
    setFilteredRestaurants(result)
  }, [restaurants, selectedCuisine, searchQuery])

  async function fetchRestaurants() {
    try {
      setLoading(true)
      const res = await fetch('/api/restaurants')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data.restaurants)
        setFilteredRestaurants(data.restaurants)
      }
    } catch (err) {
      console.error('Error fetching restaurants:', err)
    } finally {
      setLoading(false)
    }
  }

  function openRestaurant(id: string) {
    setSelectedRestaurant(id)
    setView('restaurant')
  }

  function scrollToRestaurants() {
    restaurantGridRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  function getDeliveryFee(restaurant: Restaurant): number {
    if (restaurant.zone) {
      return restaurant.zone.baseFee
    }
    if (restaurant.city) {
      const zone = deliveryZones.find((z) => z.name === restaurant.city)
      if (zone) return zone.fee
    }
    return restaurant.deliveryFee
  }

  return (
    <div className="view-transition">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#B42318] via-[#9a1f16] to-[#7d1a12] text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMCAxMHY2aC02di02aDZ6bTAgMTB2NmgtNnYtNmg2em0tMTAgMHY2aC02di02aDZ6bS0xMCAwdjZoLTZ2LTZoNnptMzAgMHY2aC02di02aDZ6bS0xMCAxMHY2aC02di02aDZ6bTEwIDB2NmgtNnYtNmg2em0tMTAgMTB2NmgtNnYtNmg2em0xMCAwdjZoLTZ2LTZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 sm:py-20 safe-area-top">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-2xl xs:text-3xl sm:text-5xl font-bold mb-3 leading-tight">
              Fraštačan doručí z Hlohovca a okolia
            </h1>
            <p className="text-base sm:text-xl mb-6 sm:mb-8 text-red-100 leading-relaxed">
              Objednaj si jedlo, kávu, kvety alebo nákup z lokálnych prevádzok v Hlohovci, Šulekove, Leopoldove a Červeníku.
            </p>
            <div className="max-w-xl mx-auto relative mb-5 sm:mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-red-400" />
              <Input
                placeholder="Zadaj adresu alebo vyber oblasť"
                className="pl-12 h-12 sm:h-14 text-base sm:text-lg bg-white/95 border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-red-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center px-2 sm:px-0">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-red-50 font-semibold h-12 sm:h-11 w-full sm:w-auto"
                onClick={scrollToRestaurants}
              >
                Objednať teraz
              </Button>
              <Button
                size="lg"
                className="border-2 border-white text-white bg-white/20 hover:bg-white/30 hover:text-white font-semibold h-12 sm:h-11 w-full sm:w-auto backdrop-blur-sm"
                onClick={scrollToRestaurants}
              >
                Pozrieť prevádzky
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Category Section */}
        <section>
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Čo si chceš nechať doručiť?
          </h2>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            <Button
              variant={selectedCuisine === null ? 'default' : 'outline'}
              className={`shrink-0 rounded-full px-4 py-2 h-9 ${selectedCuisine === null ? 'bg-primary hover:bg-primary/90 text-white' : 'border-primary/30 text-primary font-medium'}`}
              onClick={() => setSelectedCuisine(null)}
            >
              Všetky
            </Button>
            {mainCategories.map((c) => (
              <Button
                key={c.name}
                variant={selectedCuisine === c.name ? 'default' : 'outline'}
                className={`shrink-0 rounded-full px-4 py-2 h-9 ${selectedCuisine === c.name ? 'bg-primary hover:bg-primary/90 text-white' : 'border-primary/30 text-primary font-medium'}`}
                onClick={() => setSelectedCuisine(selectedCuisine === c.name ? null : c.name)}
              >
                <span className="mr-1">{c.emoji}</span> {c.name}
              </Button>
            ))}
          </div>
          {/* Extended cuisine filters (cuisine types) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mt-2 scrollbar-hide -mx-4 px-4">
            {cuisineOptions.slice(8).map((c) => (
              <Button
                key={c.name}
                variant={selectedCuisine === c.name ? 'default' : 'outline'}
                size="sm"
                className={`shrink-0 rounded-full px-3.5 py-1.5 ${selectedCuisine === c.name ? 'bg-primary hover:bg-primary/90 text-white' : 'border-primary/30 text-primary font-medium'}`}
                onClick={() => setSelectedCuisine(selectedCuisine === c.name ? null : c.name)}
              >
                <span className="mr-1">{c.emoji}</span> {c.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Locality Section */}
        <section className="bg-red-50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">
            📍 Lokálne prevádzky, lokálni kuriéri, rýchle doručenie
          </h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Fraštačan spája zákazníkov s prevádzkami v Hlohovci a okolí. Menej anonymnej platformy, viac lokálnej kontroly a férovejší prístup pre podniky aj kuriérov.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            {deliveryZones.map((zone) => (
              <Badge
                key={zone.name}
                variant="secondary"
                className="px-4 py-2 text-sm bg-white shadow-sm border border-red-100"
              >
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary" />
                {zone.name} · od {formatPrice(zone.fee)}
              </Badge>
            ))}
          </div>
        </section>

        {/* Restaurant Grid */}
        <section ref={restaurantGridRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              🏪 Prevádzky v tvojom okolí
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="h-40 w-full" />
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                😔 Žiadne prevádzky nenájdené
              </p>
              <Button
                variant="outline"
                className="mt-4 border-primary/40 text-primary hover:bg-primary/5"
                onClick={() => {
                  setSelectedCuisine(null)
                  setSearchQuery('')
                }}
              >
                Zrušiť filtre
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredRestaurants.map((restaurant, index) => (
                <motion.div
                  key={restaurant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 group border-0 shadow-sm"
                    onClick={() => openRestaurant(restaurant.id)}
                  >
                    <div className="relative h-40 sm:h-44 overflow-hidden bg-red-50">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="text-2xl">{restaurant.logo}</span>
                      </div>
                      {restaurant.isAvailable && (
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs">
                          Otvorené
                        </Badge>
                      )}
                      {/* City/Zone badge */}
                      {(restaurant.city || restaurant.zone) && (
                        <Badge className="absolute bottom-3 right-3 bg-primary text-white text-xs gap-1">
                          <MapPin className="h-3 w-3" />
                          {restaurant.zone?.name || restaurant.city}
                        </Badge>
                      )}
                      <div className="absolute bottom-3 left-3 right-20 text-white">
                        <h3 className="font-bold text-base sm:text-lg leading-tight line-clamp-2">{restaurant.name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {restaurant.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{restaurant.rating}</span>
                          <span className="text-muted-foreground">({restaurant.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{formatPrice(getDeliveryFee(restaurant))}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* For Businesses Section */}
        <section className="bg-amber-50 rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:gap-6">
            <div className="flex-shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary flex items-center justify-center">
                <Store className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-bold mb-1.5">
                Máte prevádzku v Hlohovci alebo okolí?
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Zapojte sa do lokálnej doručovacej platformy Fraštačan a získajte objednávky z vášho okolia.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shrink-0 w-full sm:w-auto h-12 font-semibold"
              onClick={() => setView('pre-prevadzky')}
            >
              Chcem zapojiť prevádzku
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>

        {/* For Couriers Section */}
        <section className="bg-blue-50 rounded-2xl p-5 sm:p-8">
          <div className="flex flex-col items-center text-center gap-4 sm:flex-row sm:text-left sm:gap-6">
            <div className="flex-shrink-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-primary flex items-center justify-center">
                <Bike className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-bold mb-1.5">
                Staň sa kuriérom Fraštačana
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">
                Rozvážaj v Hlohovci, Šulekove, Leopoldove alebo Červeníku. Vyber si dostupnosť a doručuj lokálne objednávky.
              </p>
            </div>
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white shrink-0 w-full sm:w-auto h-12 font-semibold"
              onClick={() => setView('pre-kurierov')}
            >
              Chcem doručovať
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-red-50/50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
            Ako to funguje?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '📱', title: 'Vyberte si', desc: 'Prechádzajte prevádzkami a pridávajte položky do košíka' },
              { emoji: '💳', title: 'Objednajte', desc: 'Vyplňte doručovaciu adresu a zvoľte spôsob platby' },
              { emoji: '🛵', title: 'Doručíme', desc: 'Lokálny kuriér vám doručí objednávku čo najskôr' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-3">{step.emoji}</div>
                <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
