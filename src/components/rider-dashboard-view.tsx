'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  MapPin,
  Package,
  Wallet,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Bike,
  ShoppingBag,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils-shared'
import { toast } from 'sonner'
import RiderBottomNav from '@/components/rider-bottom-nav'

interface RiderProfile {
  id: string
  userId: string
  isAvailable: boolean
  currentLat: number | null
  currentLng: number | null
  vehicleType: string
  totalDeliveries: number
  totalEarnings: number
  walletBalance: number
  rating: number
  reviewCount: number
}

interface RiderUser {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  role: string
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
  discount: number
  total: number
  notes: string | null
  deliveryAddress: string
  createdAt: string
  deliveredAt: string | null
  restaurant?: {
    id: string
    name: string
    image: string
    logo: string | null
    address: string
    phone: string | null
  }
  customer?: {
    id: string
    name: string
    phone: string | null
  }
  items?: OrderItem[]
}

export default function RiderDashboardView() {
  const { user } = useAppStore()
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [riderUser, setRiderUser] = useState<RiderUser | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [activeOrdersCount, setActiveOrdersCount] = useState(0)
  const [todaysEarnings, setTodaysEarnings] = useState(0)
  const [availableOrders, setAvailableOrders] = useState<Order[]>([])
  const [activeOrders, setActiveOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null)
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [profileRes, availableRes, activeRes] = await Promise.all([
        fetch('/api/rider'),
        fetch('/api/rider/available-orders'),
        fetch('/api/rider/my-orders'),
      ])

      if (!profileRes.ok) throw new Error('Chyba pri načítaní profilu')

      const profileData = await profileRes.json()
      setProfile(profileData.profile)
      setRiderUser(profileData.user)
      setIsAvailable(profileData.profile.isAvailable)
      setActiveOrdersCount(profileData.activeOrdersCount)
      setTodaysEarnings(profileData.todaysEarnings)

      if (availableRes.ok) {
        const availableData = await availableRes.json()
        setAvailableOrders(availableData.orders || [])
      }

      if (activeRes.ok) {
        const activeData = await activeRes.json()
        setActiveOrders(activeData.orders || [])
      }

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
      const res = await fetch('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })
      if (res.ok) {
        setIsAvailable(!isAvailable)
        toast.success(isAvailable ? 'Ste teraz nedostupný' : 'Ste teraz dostupný')
      } else {
        toast.error('Chyba pri zmene dostupnosti')
      }
    } catch {
      toast.error('Chyba pri zmene dostupnosti')
    }
  }

  async function acceptOrder(orderId: string) {
    setAcceptingOrderId(orderId)
    try {
      const res = await fetch('/api/rider/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Objednávka prijatá!')
        fetchData()
      } else {
        toast.error(data.error || 'Chyba pri prijímaní objednávky')
      }
    } catch {
      toast.error('Chyba pri prijímaní objednávky')
    } finally {
      setAcceptingOrderId(null)
    }
  }

  async function deliverOrder(orderId: string) {
    setDeliveringOrderId(orderId)
    try {
      const res = await fetch('/api/rider/deliver-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Objednávka označená ako doručená!')
        fetchData()
      } else {
        toast.error(data.error || 'Chyba pri označovaní objednávky')
      }
    } catch {
      toast.error('Chyba pri označovaní objednávky')
    } finally {
      setDeliveringOrderId(null)
    }
  }

  function handleRefresh() {
    fetchData(true)
  }

  // Loading skeletons
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-orange-500 px-4 pt-6 pb-8 rounded-b-3xl">
          <Skeleton className="h-6 w-40 bg-orange-400/30 mb-4" />
          <Skeleton className="h-12 w-full bg-orange-400/30 rounded-xl" />
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
        <RiderBottomNav />
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
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <RiderBottomNav />
      </div>
    )
  }

  const firstName = riderUser?.name?.split(' ')[0] || 'Kurier'

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with greeting and availability toggle */}
      <div className="bg-orange-500 px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-orange-100 text-sm">Vitajte späť,</p>
              <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-orange-400/30 text-white hover:bg-orange-400/50 transition-colors"
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
                  {isAvailable ? 'Dostupný' : 'Nedostupný'}
                </p>
                <p className="text-orange-100 text-xs">
                  {isAvailable ? 'Dostávate nové objednávky' : 'Zapnite si dostupnosť'}
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
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Dnešné zárobky</span>
                </div>
                <p className="text-lg font-bold">{formatPrice(todaysEarnings)}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-orange-100 rounded-lg">
                    <Bike className="h-4 w-4 text-orange-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Aktívne doruč.</span>
                </div>
                <p className="text-lg font-bold">{activeOrdersCount}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Package className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Celkom doručení</span>
                </div>
                <p className="text-lg font-bold">{profile?.totalDeliveries ?? 0}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="text-xs text-muted-foreground">Peňaženka</span>
                </div>
                <p className="text-lg font-bold">{formatPrice(profile?.walletBalance ?? 0)}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Active Deliveries Section */}
      {activeOrders.length > 0 && (
        <div className="max-w-lg mx-auto px-4 mt-6">
          <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
            <Bike className="h-4 w-4 text-orange-500" />
            Aktívne doručenia ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {activeOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-l-4 border-l-orange-500 border-0 shadow-md overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{order.restaurant?.logo || '🏪'}</span>
                          <div>
                            <p className="font-semibold text-sm">{order.restaurant?.name}</p>
                            <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
                          </div>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
                          Na ceste
                        </Badge>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-2">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{order.deliveryAddress}</span>
                      </div>

                      {/* Expandable items */}
                      <button
                        className="flex items-center gap-1 text-xs text-orange-500 mb-3"
                        onClick={() =>
                          setExpandedOrder(expandedOrder === order.id ? null : order.id)
                        }
                      >
                        <ShoppingBag className="h-3 w-3" />
                        {order.items?.length || 0} položiek
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedOrder === order.id && order.items && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-3"
                          >
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-gray-600">
                                    {item.quantity}x {item.foodItem?.name}
                                  </span>
                                  <span className="text-gray-500">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        className="w-full bg-green-500 hover:bg-green-600 text-white h-11 text-sm font-semibold"
                        onClick={() => deliverOrder(order.id)}
                        disabled={deliveringOrderId === order.id}
                      >
                        {deliveringOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        Doručené
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Available Orders Section */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-orange-500" />
          Dostupné objednávky
          {availableOrders.length > 0 && (
            <Badge className="bg-orange-500 text-white text-xs ml-1">
              {availableOrders.length}
            </Badge>
          )}
        </h2>

        {availableOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Žiadne dostupné objednávky</p>
            <p className="text-gray-400 text-xs mt-1">Nové objednávky sa zobrazia automaticky</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {availableOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-0 shadow-md overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{order.restaurant?.logo || '🏪'}</span>
                          <div>
                            <p className="font-semibold text-sm">{order.restaurant?.name}</p>
                            <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{formatPrice(order.total)}</p>
                          <p className="text-xs text-green-600">
                            +{formatPrice(order.deliveryFee)} poplatok
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{order.deliveryAddress}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                        <Clock className="h-3 w-3" />
                        <span>{order.items?.length || 0} položiek</span>
                      </div>

                      {/* Expandable items */}
                      <button
                        className="flex items-center gap-1 text-xs text-orange-500 mb-3"
                        onClick={() =>
                          setExpandedOrder(expandedOrder === order.id ? null : order.id)
                        }
                      >
                        <ShoppingBag className="h-3 w-3" />
                        Zobraziť položky
                        {expandedOrder === order.id ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </button>

                      <AnimatePresence>
                        {expandedOrder === order.id && order.items && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mb-3"
                          >
                            <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                              {order.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between text-xs"
                                >
                                  <span className="text-gray-600">
                                    {item.quantity}x {item.foodItem?.name}
                                  </span>
                                  <span className="text-gray-500">
                                    {formatPrice(item.price * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 text-sm font-semibold"
                        onClick={() => acceptOrder(order.id)}
                        disabled={acceptingOrderId === order.id || !isAvailable}
                      >
                        {acceptingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Package className="h-4 w-4 mr-2" />
                        )}
                        Prijať objednávku
                      </Button>
                      {!isAvailable && acceptingOrderId !== order.id && (
                        <p className="text-xs text-center text-red-400 mt-1">
                          Zapnite dostupnosť na prijatie objednávky
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <RiderBottomNav />
    </div>
  )
}
