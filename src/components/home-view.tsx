'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Clock, Star, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Restaurant } from '@/lib/store'

const cuisines = [
  { name: 'Slovenská', emoji: '🇸🇰' },
  { name: 'Talianska', emoji: '🇮🇹' },
  { name: 'Japonská', emoji: '🇯🇵' },
  { name: 'Americká', emoji: '🇺🇸' },
  { name: 'Mexická', emoji: '🇲🇽' },
]

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

export default function HomeView() {
  const { setView, setSelectedRestaurant, searchQuery, setSearchQuery } = useAppStore()
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([])
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="view-transition">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZ2LTZoNnptMC0zMHY2aC02VjRoNnptMCAxMHY2aC02di02aDZ6bTAgMTB2NmgtNnYtNmg2em0tMTAgMHY2aC02di02aDZ6bS0xMCAwdjZoLTZ2LTZoNnptMzAgMHY2aC02di02aDZ6bS0xMCAxMHY2aC02di02aDZ6bTEwIDB2NmgtNnYtNmg2em0tMTAgMTB2NmgtNnYtNmg2em0xMCAwdjZoLTZ2LTZoNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-3xl sm:text-5xl font-bold mb-3">
              Fraštačan 🍽️
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-orange-100">
              Najchutnejšie jedlo priamo pred vaše dvere
            </p>
            <div className="max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
              <Input
                placeholder="Hľadajte reštauráciu alebo jedlo..."
                className="pl-12 h-12 sm:h-14 text-base sm:text-lg bg-white/95 border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-orange-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Cuisine Categories */}
        <section>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCuisine === null ? 'default' : 'outline'}
              className={`shrink-0 rounded-full px-5 ${selectedCuisine === null ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
              onClick={() => setSelectedCuisine(null)}
            >
              Všetky
            </Button>
            {cuisines.map((c) => (
              <Button
                key={c.name}
                variant={selectedCuisine === c.name ? 'default' : 'outline'}
                className={`shrink-0 rounded-full px-5 ${selectedCuisine === c.name ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
                onClick={() => setSelectedCuisine(selectedCuisine === c.name ? null : c.name)}
              >
                <span className="mr-1.5">{c.emoji}</span> {c.name}
              </Button>
            ))}
          </div>
        </section>

        {/* Featured Restaurants */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold">
              🔥 Populárne reštaurácie
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
                😔 Žiadne reštaurácie nenájdené
              </p>
              <Button
                variant="outline"
                className="mt-4"
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
                    <div className="relative h-40 sm:h-44 overflow-hidden bg-orange-50">
                      <img
                        src={restaurant.image}
                        alt={restaurant.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="text-2xl">{restaurant.logo}</span>
                      </div>
                      {restaurant.isAvailable && (
                        <Badge className="absolute top-3 right-3 bg-green-500 text-white text-xs">
                          Otvorené
                        </Badge>
                      )}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-bold text-lg leading-tight">{restaurant.name}</h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {restaurant.description}
                      </p>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-orange-400 text-orange-400" />
                          <span className="font-medium">{restaurant.rating}</span>
                          <span className="text-muted-foreground">({restaurant.reviewCount})</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{formatPrice(restaurant.deliveryFee)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="bg-orange-50 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center">
            Ako to funguje?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { emoji: '📱', title: 'Vyberte si', desc: 'Prechádzajte reštauráciami a pridávajte jedlá do košíka' },
              { emoji: '💳', title: 'Objednajte', desc: 'Vyplňte doručovaciu adresu a zvoľte spôsob platby' },
              { emoji: '🛵', title: 'Doručíme', desc: 'Vaše jedlo doručíme priamo k vám čo najskôr' },
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
