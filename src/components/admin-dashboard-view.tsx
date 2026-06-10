'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Package, DollarSign, Users, Store, TrendingUp, Star, UtensilsCrossed, RefreshCw, MapPin, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatPrice, formatDate, statusConfig } from '@/lib/utils-shared'
import { toast } from 'sonner'

interface AdminStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalRestaurants: number
  totalFoodItems: number
  totalZones: number
  totalCoupons: number
  ordersByStatus: Record<string, number>
  revenueByDay: Record<string, number>
}

interface RecentOrder {
  id: string
  orderNumber: string
  status: string
  total: number
  createdAt: string
  customer: { name: string; email: string }
  restaurant: { name: string }
}

interface TopRestaurant {
  id: string
  name: string
  rating: number
  reviewCount: number
  logo?: string | null
  _count: { orders: number }
}

export default function AdminDashboardView() {
  const { user, setView } = useAppStore()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [topRestaurants, setTopRestaurants] = useState<TopRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setRecentOrders(data.recentOrders)
        setTopRestaurants(data.topRestaurants)
      } else {
        toast.error('Chyba pri načítaní štatistík')
      }
    } catch {
      toast.error('Chyba pri načítaní štatistík')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats()
    }
  }, [user, fetchStats])

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">Nemáte oprávnenie na zobrazenie tejto stránky</p>
        <Button className="mt-4" onClick={() => setView('home')}>
          Späť na domov
        </Button>
      </div>
    )
  }

  const statCards = [
    { label: 'Objednávky', value: stats?.totalOrders || 0, icon: Package, from: 'from-primary/5', to: 'to-primary/10', text: 'text-primary', iconColor: 'text-primary/80' },
    { label: 'Tržby', value: formatPrice(stats?.totalRevenue || 0), icon: DollarSign, from: 'from-green-50', to: 'to-green-100', text: 'text-green-600', iconColor: 'text-green-400' },
    { label: 'Používatelia', value: stats?.totalUsers || 0, icon: Users, from: 'from-blue-50', to: 'to-blue-100', text: 'text-blue-600', iconColor: 'text-blue-400' },
    { label: 'Prevádzky', value: stats?.totalRestaurants || 0, icon: Store, from: 'from-purple-50', to: 'to-purple-100', text: 'text-purple-600', iconColor: 'text-purple-400' },
    { label: 'Jedlá', value: stats?.totalFoodItems || 0, icon: UtensilsCrossed, from: 'from-rose-50', to: 'to-rose-100', text: 'text-rose-600', iconColor: 'text-rose-400' },
    { label: 'Zóny', value: stats?.totalZones || 0, icon: MapPin, from: 'from-teal-50', to: 'to-teal-100', text: 'text-teal-600', iconColor: 'text-teal-400' },
    { label: 'Kupóny', value: stats?.totalCoupons || 0, icon: Tag, from: 'from-amber-50', to: 'to-amber-100', text: 'text-amber-600', iconColor: 'text-amber-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Prehľad</h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={refreshing}
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {statCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className={`border-0 shadow-sm bg-gradient-to-br ${card.from} ${card.to}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">{card.label}</p>
                        <p className={`text-xl sm:text-2xl font-bold ${card.text}`}>
                          {card.value}
                        </p>
                      </div>
                      <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Orders by Status */}
          {stats?.ordersByStatus && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Objednávky podľa stavu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                    const config = statusConfig[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' }
                    return (
                      <div key={status} className={`px-3 py-1.5 rounded-lg ${config.bgColor}`}>
                        <span className={`font-medium text-sm ${config.color}`}>
                          {config.label}: {count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Posledné objednávky
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/5"
                    onClick={() => setView('admin-orders')}
                  >
                    Všetky
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Zatiaľ žiadne objednávky</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
                    {recentOrders.map((order) => {
                      const config = statusConfig[order.status] || statusConfig.pending
                      return (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-white"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{order.orderNumber}</span>
                              <Badge className={`${config.bgColor} ${config.color} border-0 text-xs`}>
                                {config.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.customer?.name} • {order.restaurant?.name}
                            </p>
                          </div>
                          <div className="text-right shrink-0 ml-3">
                            <p className="font-bold text-sm text-primary">{formatPrice(order.total)}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Restaurants */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top reštaurácie
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/5"
                    onClick={() => setView('admin-restaurants')}
                  >
                    Všetky
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {topRestaurants.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Zatiaľ žiadne reštaurácie</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topRestaurants.map((r, index) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="font-bold text-sm text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {r.logo && (
                              <img
                                src={r.logo}
                                alt=""
                                className="h-5 w-5 rounded object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none'
                                }}
                              />
                            )}
                            <span className="font-medium text-sm truncate">{r.name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-primary/80 text-primary/80" />
                            <span>{r.rating}</span>
                            <span>•</span>
                            <span>{r._count.orders} objednávok</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
