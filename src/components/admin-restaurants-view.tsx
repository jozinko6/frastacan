'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Store, Star, MapPin, Phone, RefreshCw, Search, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatPrice, cuisineOptions } from '@/lib/utils-shared'
import { toast } from 'sonner'

interface AdminRestaurant {
  id: string
  name: string
  slug: string
  description: string
  image: string
  logo?: string | null
  address: string
  phone?: string | null
  cuisine: string
  rating: number
  reviewCount: number
  deliveryTime: string
  minimumOrder: number
  deliveryFee: number
  isActive: boolean
  isAvailable: boolean
  owner: { name: string; email: string; phone?: string | null }
  categories: { name: string; _count: { foodItems: number } }[]
  _count: { foodItems: number; orders: number; reviews: number; favorites: number }
}

export default function AdminRestaurantsView() {
  const { user, setView } = useAppStore()
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisineFilter, setCuisineFilter] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchRestaurants = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/restaurants')
      if (res.ok) {
        const data = await res.json()
        setRestaurants(data.restaurants)
      } else {
        toast.error('Chyba pri načítaní reštaurácií')
      }
    } catch {
      toast.error('Chyba pri načítaní reštaurácií')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRestaurants()
    }
  }, [user, fetchRestaurants])

  async function toggleField(id: string, field: 'isActive' | 'isAvailable', value: boolean) {
    try {
      setTogglingId(id)
      const res = await fetch(`/api/admin/restaurants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (res.ok) {
        const data = await res.json()
        setRestaurants((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...data.restaurant } : r))
        )
        toast.success(value
          ? `${field === 'isActive' ? 'Aktivovaná' : 'Zverejnená'}: ${data.restaurant.name}`
          : `${field === 'isActive' ? 'Deaktivovaná' : 'Skrytá'}: ${data.restaurant.name}`
        )
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri aktualizácii')
      }
    } catch {
      toast.error('Chyba pri aktualizácii')
    } finally {
      setTogglingId(null)
    }
  }

  // Filter restaurants by search and cuisine
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = searchQuery === '' ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCuisine = !cuisineFilter ||
      r.cuisine.toLowerCase().includes(cuisineFilter.toLowerCase())

    return matchesSearch && matchesCuisine
  })

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">Nemáte oprávnenie</p>
        <Button className="mt-4" onClick={() => setView('home')}>Späť na domov</Button>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('admin-dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Správa reštaurácií</h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRestaurants}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hľadať podľa názvu, kuchyne alebo adresy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={cuisineFilter === null ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 rounded-full ${cuisineFilter === null ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
            onClick={() => setCuisineFilter(null)}
          >
            Všetky
          </Button>
          {cuisineOptions.map((c) => (
            <Button
              key={c.name}
              variant={cuisineFilter === c.name ? 'default' : 'outline'}
              size="sm"
              className={`shrink-0 rounded-full ${cuisineFilter === c.name ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
              onClick={() => setCuisineFilter(cuisineFilter === c.name ? null : c.name)}
            >
              {c.emoji} {c.name}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filteredRestaurants.length === 0 ? (
        <div className="text-center py-12">
          <Store className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {searchQuery || cuisineFilter
              ? 'Žiadne reštaurácie nezodpovedajú filtrom'
              : 'Zatiaľ žiadne reštaurácie'}
          </p>
          {(searchQuery || cuisineFilter) && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setSearchQuery('')
                setCuisineFilter(null)
              }}
            >
              Zrušiť filtre
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRestaurants.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-orange-50 relative group">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        const fallback = target.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                    <div
                      className="absolute inset-0 bg-orange-50 items-center justify-center hidden"
                    >
                      <ImageOff className="h-8 w-8 text-orange-300" />
                    </div>
                  </div>
                  {/* Details */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          {r.logo ? (
                            <img
                              src={r.logo}
                              alt=""
                              className="h-6 w-6 rounded object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                          ) : (
                            <Store className="h-5 w-5 text-muted-foreground" />
                          )}
                          <h3 className="font-bold text-lg">{r.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{r.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => toggleField(r.id, 'isActive', !r.isActive)}
                          disabled={togglingId === r.id}
                          className="focus:outline-none transition-opacity hover:opacity-80 disabled:opacity-50"
                          title={r.isActive ? 'Deaktivovať reštauráciu' : 'Aktivovať reštauráciu'}
                        >
                          {r.isActive ? (
                            <Badge className="bg-green-100 text-green-700 border-0 cursor-pointer">Aktívna</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-0 cursor-pointer">Neaktívna</Badge>
                          )}
                        </button>
                        <button
                          onClick={() => toggleField(r.id, 'isAvailable', !r.isAvailable)}
                          disabled={togglingId === r.id}
                          className="focus:outline-none transition-opacity hover:opacity-80 disabled:opacity-50"
                          title={r.isAvailable ? 'Skryť reštauráciu' : 'Zverejniť reštauráciu'}
                        >
                          {r.isAvailable ? (
                            <Badge className="bg-blue-100 text-blue-700 border-0 cursor-pointer">Dostupná</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700 border-0 cursor-pointer">Nedostupná</Badge>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kuchyňa</p>
                        <p className="font-medium">{r.cuisine}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hodnotenie</p>
                        <div className="flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                          <span className="font-medium">{r.rating} ({r.reviewCount})</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Doručovné</p>
                        <p className="font-medium">{formatPrice(r.deliveryFee)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min. objednávka</p>
                        <p className="font-medium">{formatPrice(r.minimumOrder)}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.address}
                      </div>
                      {r.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {r.phone}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        📋 {r._count.foodItems} položiek
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        📦 {r._count.orders} objednávok
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {r._count.reviews} recenzií
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        ❤️ {r._count.favorites} obľúbení
                      </Badge>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Vlastník: {r.owner.name} ({r.owner.email})
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
