'use client'

import { useState, useEffect, useCallback } from 'react'
import { Grid3X3, RefreshCw, Store } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { authFetchOrLogout } from '@/lib/utils-shared'
import { toast } from 'sonner'

interface CategoryItem {
  id: string
  name: string
  icon?: string | null
  sortOrder: number
  restaurant: {
    id: string
    name: string
    logo?: string | null
    city: string
  }
  _count: { foodItems: number }
}

export default function AdminCategoriesView() {
  const { user, setView } = useAppStore()
  const [categories, setCategories] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await authFetchOrLogout('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      } else {
        toast.error('Chyba pri načítaní kategórií')
      }
    } catch {
      toast.error('Chyba pri načítaní kategórií')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCategories()
    }
  }, [user, fetchCategories])

  // Group categories by restaurant
  const grouped = categories.reduce<Record<string, { restaurant: CategoryItem['restaurant']; categories: CategoryItem[] }>>((acc, cat) => {
    const rId = cat.restaurant.id
    if (!acc[rId]) {
      acc[rId] = { restaurant: cat.restaurant, categories: [] }
    }
    acc[rId].categories.push(cat)
    return acc
  }, {})

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">Nemáte oprávnenie</p>
        <Button className="mt-4" onClick={() => setView('home')}>Späť na domov</Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-primary" />
          Kategórie
        </h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCategories}
          disabled={refreshing}
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Zoznam kategórií jedál zoskupený podľa prevádzok. Celkovo {categories.length} kategórií v {Object.keys(grouped).length} prevádzkach.
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Grid3X3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Zatiaľ žiadne kategórie</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto custom-scrollbar pr-1">
          {Object.entries(grouped).map(([, group]) => (
            <Card key={group.restaurant.id} className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {group.restaurant.logo ? (
                    <img
                      src={group.restaurant.logo}
                      alt=""
                      className="h-5 w-5 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <Store className="h-4 w-4 text-muted-foreground" />
                  )}
                  {group.restaurant.name}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {group.restaurant.city}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-normal ml-auto">
                    {group.categories.length} kategórií
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {group.categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {cat.icon ? (
                          <span className="text-lg">{cat.icon}</span>
                        ) : (
                          <span className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                            {cat.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="font-medium text-sm">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">
                          {cat._count.foodItems} položiek
                        </Badge>
                        <span className="text-xs text-muted-foreground w-14 text-right">
                          #{cat.sortOrder}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
