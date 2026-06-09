'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Store, Star, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

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

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchRestaurants()
    }
  }, [user])

  async function fetchRestaurants() {
    try {
      setLoading(true)
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
    }
  }

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
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {restaurants.map((r) => (
            <Card key={r.id} className="border-0 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="w-full sm:w-48 h-36 sm:h-auto shrink-0 bg-orange-50">
                    <img
                      src={r.image}
                      alt={r.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-1 p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{r.logo}</span>
                          <h3 className="font-bold text-lg">{r.name}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{r.description}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {r.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-0">Aktívna</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0">Neaktívna</Badge>
                        )}
                        {r.isAvailable ? (
                          <Badge className="bg-blue-100 text-blue-700 border-0">Dostupná</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-700 border-0">Nedostupná</Badge>
                        )}
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
