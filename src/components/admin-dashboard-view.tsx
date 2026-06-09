'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, DollarSign, Users, Store, TrendingUp, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Čakajúca', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Potvrdená', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  preparing: { label: 'Pripravuje sa', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ready: { label: 'Pripravená', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivering: { label: 'Na ceste', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: 'Doručená', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Zrušená', color: 'text-red-700', bgColor: 'bg-red-100' },
}

interface AdminStats {
  totalOrders: number
  totalRevenue: number
  totalUsers: number
  totalRestaurants: number
  totalFoodItems: number
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

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchStats()
    }
  }, [user])

  async function fetchStats() {
    try {
      setLoading(true)
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
    }
  }

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

  return (
    <div className="view-transition max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Administrácia</h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Objednávky</p>
                      <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                        {stats?.totalOrders || 0}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tržby</p>
                      <p className="text-2xl sm:text-3xl font-bold text-green-600">
                        {formatPrice(stats?.totalRevenue || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Používatelia</p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-600">
                        {stats?.totalUsers || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Reštaurácie</p>
                      <p className="text-2xl sm:text-3xl font-bold text-purple-600">
                        {stats?.totalRestaurants || 0}
                      </p>
                    </div>
                    <Store className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Orders by Status */}
          {stats?.ordersByStatus && (
            <Card className="border-0 shadow-sm mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Objednávky podľa stavu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.ordersByStatus).map(([status, count]) => {
                    const config = statusConfig[status] || { label: status, color: 'text-gray-700', bgColor: 'bg-gray-100' }
                    return (
                      <div key={status} className={`px-4 py-2 rounded-lg ${config.bgColor}`}>
                        <span className={`font-medium ${config.color}`}>
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
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                    Posledné objednávky
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-500"
                    onClick={() => setView('admin-orders')}
                  >
                    Všetky
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
                          <p className="font-bold text-sm text-orange-600">{formatPrice(order.total)}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Restaurants */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-orange-500" />
                    Top reštaurácie
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-500"
                    onClick={() => setView('admin-restaurants')}
                  >
                    Všetky
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRestaurants.map((r, index) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-white"
                    >
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <span className="font-bold text-sm text-orange-600">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {r.logo && <span>{r.logo}</span>}
                          <span className="font-medium text-sm truncate">{r.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                          <span>{r.rating}</span>
                          <span>•</span>
                          <span>{r._count.orders} objednávok</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
