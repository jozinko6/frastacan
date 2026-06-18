'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Package,
  DollarSign,
  Clock,
  ShoppingBag,
  UtensilsCrossed,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatPrice, formatDate, statusConfig, authFetchOrLogout } from '@/lib/utils-shared'
import { toast } from 'sonner'
import VendorBottomNav from '@/components/vendor-bottom-nav'

interface RestaurantInfo {
  id: string
  name: string
  description: string
  image: string
  logo: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  cuisine: string
  isAvailable: boolean
  isActive: boolean
  deliveryType: string
  minimumOrder: number
  deliveryFee: number
  openingHours: string | null
}

interface OrderItem {
  id: string
  quantity: number
  price: number
  foodItem?: { id: string; name: string; image: string | null; price: number }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  deliveryFee: number
  total: number
  notes: string | null
  createdAt: string
  customer?: { id: string; name: string; phone: string | null }
  items?: OrderItem[]
}

export default function VendorDashboardView() {
  const { user, setView } = useAppStore()
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [todaysOrders, setTodaysOrders] = useState(0)
  const [todaysRevenue, setTodaysRevenue] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [activeMenuItems, setActiveMenuItems] = useState(0)
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [vendorRes, ordersRes] = await Promise.all([
        authFetchOrLogout('/api/vendor'),
        authFetchOrLogout('/api/vendor/orders'),
      ])

      if (!vendorRes.ok) throw new Error('Chyba pri načítaní prevádzky')
      if (!ordersRes.ok) throw new Error('Chyba pri načítaní objednávok')

      const vendorData = await vendorRes.json()
      const ordersData = await ordersRes.json()

      setRestaurant(vendorData.restaurant)
      setIsAvailable(vendorData.restaurant.isAvailable)
      setTodaysOrders(vendorData.todaysOrders)
      setTodaysRevenue(vendorData.todaysRevenue)
      setPendingCount(vendorData.pendingOrders)
      setActiveMenuItems(vendorData.activeMenuItems)

      // Recent orders = last 5
      const allOrders: Order[] = ordersData.orders || []
      setRecentOrders(allOrders.slice(0, 5))

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  async function toggleAvailability() {
    try {
      const res = await authFetchOrLogout('/api/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })
      if (res.ok) {
        setIsAvailable(!isAvailable)
        toast.success(isAvailable ? 'Prevádzka je teraz zatvorená' : 'Prevádzka je teraz otvorená')
      } else {
        toast.error('Chyba pri zmene dostupnosti')
      }
    } catch {
      toast.error('Chyba pri zmene dostupnosti')
    }
  }

  function handleRefresh() {
    fetchData(true)
  }

  // Loading skeletons
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-emerald-600 px-4 pt-6 pb-8 rounded-b-3xl">
          <Skeleton className="h-6 w-40 bg-emerald-400/30 mb-4" />
          <Skeleton className="h-12 w-full bg-emerald-400/30 rounded-xl" />
        </div>
        <div className="px-4 -mt-4 grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <div className="px-4 mt-6 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <VendorBottomNav />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <VendorBottomNav />
      </div>
    )
  }

  const firstName = user?.name?.split(' ')[0] || 'Prevádzkovateľ'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with greeting and availability toggle */}
      <div className="bg-emerald-600 px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-emerald-100 text-sm">Vitajte späť,</p>
              <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-emerald-400/30 text-white hover:bg-emerald-400/50 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Availability Toggle */}
          <motion.div
            layout
            className="mt-4 bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  isAvailable ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                )}
              />
              <div>
                <p className="text-white font-medium text-sm">
                  {isAvailable ? 'Som otvorený' : 'Som zatvorený'}
                </p>
                <p className="text-emerald-100 text-xs">
                  {isAvailable ? 'Prijímate nové objednávky' : 'Zapnite si dostupnosť'}
                </p>
              </div>
            </div>
            <Switch
              checked={isAvailable}
              onCheckedChange={toggleAvailability}
              className="scale-125 data-[state=checked]:bg-green-500"
            />
          </motion.div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-lg mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <ShoppingBag className="h-4 w-4 text-emerald-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Dnešné objednávky</span>
                </div>
                <p className="text-lg font-bold">{todaysOrders}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Dnešný obrat</span>
                </div>
                <p className="text-lg font-bold">{formatPrice(todaysRevenue)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-yellow-100 rounded-lg">
                    <Clock className="h-4 w-4 text-yellow-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Čakajúce objednávky</span>
                </div>
                <p className="text-lg font-bold">{pendingCount}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg">
                    <UtensilsCrossed className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Aktívne položky</span>
                </div>
                <p className="text-lg font-bold">{activeMenuItems}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <Package className="h-4 w-4 text-emerald-600" />
            Posledné objednávky
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 text-xs"
            onClick={() => setView('vendor-orders')}
          >
            Všetky objednávky
          </Button>
        </div>

        {recentOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Zatiaľ žiadne objednávky</p>
            <p className="text-gray-400 text-xs mt-1">Nové objednávky sa zobrazia automaticky</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {recentOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-0 shadow-md overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold text-sm">#{order.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">{order.customer?.name || 'Neznámy zákazník'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${status.bgColor} ${status.color} hover:${status.bgColor} text-xs border-0`}>
                              {status.icon} {status.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(order.createdAt)}
                          </div>
                          <span className="font-semibold text-gray-700">{formatPrice(order.total)}</span>
                        </div>
                        {order.status === 'pending' && (
                          <div className="mt-2 bg-yellow-50 border border-yellow-200 rounded-lg p-2.5">
                            <p className="text-xs text-yellow-700">
                              Prišla nová objednávka. Potvrďte ju a nastavte približný čas prípravy.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <VendorBottomNav />
    </div>
  )
}
