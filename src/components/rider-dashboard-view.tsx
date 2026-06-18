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
  Phone,
  Navigation,
  Footprints,
  Car,
  Banknote,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatPrice, authFetchOrLogout } from '@/lib/utils-shared'
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
  city: string | null
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
    city?: string
  }
  customer?: {
    id: string
    name: string
    phone: string | null
  }
  items?: OrderItem[]
}

const vehicleOptions: { key: string; label: string; icon: typeof Bike }[] = [
  { key: 'bicycle', label: 'Bicykel', icon: Bike },
  { key: 'scooter', label: 'Skúter', icon: Bike },
  { key: 'car', label: 'Auto', icon: Car },
  { key: 'foot', label: 'Pešo', icon: Footprints },
]

function getVehicleIcon(type: string) {
  const v = vehicleOptions.find((o) => o.key === type)
  return v || vehicleOptions[0]
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
  const [pickupConfirmed, setPickupConfirmed] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const [profileRes, availableRes, activeRes] = await Promise.all([
        authFetchOrLogout('/api/rider'),
        authFetchOrLogout('/api/rider/available-orders'),
        authFetchOrLogout('/api/rider/my-orders'),
      ])

      if (!profileRes.ok) {
        const errData = await profileRes.json().catch(() => ({}))
        throw new Error(errData.error || 'Chyba pri načítaní profilu')
      }

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
      const res = await authFetchOrLogout('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })
      if (res.ok) {
        setIsAvailable(!isAvailable)
        toast.success(isAvailable ? 'Som nedostupný' : 'Som dostupný')
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
      const res = await authFetchOrLogout('/api/rider/accept-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Doručenie prijaté!')
        fetchData()
      } else {
        toast.error(data.error || 'Chyba pri prijímaní doručenia')
      }
    } catch {
      toast.error('Chyba pri prijímaní doručenia')
    } finally {
      setAcceptingOrderId(null)
    }
  }

  async function deliverOrder(orderId: string) {
    setDeliveringOrderId(orderId)
    try {
      const res = await authFetchOrLogout('/api/rider/deliver-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Objednávka doručená!')
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

  function handlePickup(orderId: string) {
    setPickupConfirmed((prev) => new Set(prev).add(orderId))
    toast.success('Objednávka prevzatá!')
  }

  function handleRefresh() {
    fetchData(true)
  }

  // Loading skeletons
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-[#B42318] px-4 pt-6 pb-8 rounded-b-3xl">
          <Skeleton className="h-6 w-40 bg-white/20 mb-4" />
          <Skeleton className="h-12 w-full bg-white/15 rounded-xl" />
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
          <Button onClick={handleRefresh} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <RiderBottomNav />
      </div>
    )
  }

  const firstName = riderUser?.name?.split(' ')[0] || 'Kurier'
  const currentVehicle = getVehicleIcon(profile?.vehicleType || 'bicycle')
  const VehicleIcon = currentVehicle.icon

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with greeting and availability toggle */}
      <div className="bg-[#B42318] px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-1">
            <div>
              <p className="text-red-200 text-sm">Vitajte späť,</p>
              <h1 className="text-white text-xl font-bold">{firstName} 👋</h1>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Vehicle type badge */}
          <div className="mt-3 flex items-center gap-2">
            <div className="bg-white/15 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <VehicleIcon className="h-4 w-4 text-white" />
              <span className="text-white text-xs font-medium">{currentVehicle.label}</span>
            </div>
          </div>

          {/* Availability Toggle */}
          <motion.div
            layout
            className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
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
                  {isAvailable ? 'Som dostupný' : 'Som nedostupný'}
                </p>
                <p className="text-red-200 text-xs">
                  {isAvailable ? 'Dostávate nové doručovacie úlohy' : 'Zapnite si dostupnosť'}
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
                  <div className="p-1.5 bg-[#B42318]/10 rounded-lg">
                    <Bike className="h-4 w-4 text-[#B42318]" />
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
            <Bike className="h-4 w-4 text-[#B42318]" />
            Aktívne doručenia ({activeOrders.length})
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {activeOrders.map((order, index) => {
                const isPickedUp = pickupConfirmed.has(order.id)
                const isCashPayment = order.paymentMethod === 'cash'

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-l-4 border-l-[#B42318] border-0 shadow-md overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{order.restaurant?.logo || '🏪'}</span>
                            <div>
                              <p className="font-semibold text-sm">{order.restaurant?.name}</p>
                              <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
                            </div>
                          </div>
                          <Badge className="bg-[#B42318]/10 text-[#B42318] hover:bg-[#B42318]/10 text-xs">
                            {isPickedUp ? 'Na ceste k zákazníkovi' : 'Čaká na prevzatie'}
                          </Badge>
                        </div>

                        {/* City/Zone info */}
                        {(order.city || order.restaurant?.city) && (
                          <div className="flex items-center gap-1 text-xs text-[#B42318] font-medium mb-1">
                            <MapPin className="h-3 w-3" />
                            <span>{order.city || order.restaurant?.city}</span>
                          </div>
                        )}

                        <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-2">
                          <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{order.deliveryAddress}</span>
                        </div>

                        {/* Cash payment info */}
                        {isCashPayment && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Banknote className="h-3.5 w-3.5 text-amber-600" />
                              <span className="text-xs font-semibold text-amber-700">Platba hotovosťou</span>
                            </div>
                            <p className="text-xs text-amber-700">
                              Zákazník platí hotovosťou. Vyberte sumu <strong>{formatPrice(order.total)}</strong> pri odovzdaní objednávky.
                            </p>
                          </div>
                        )}

                        {/* Contact buttons */}
                        <div className="flex gap-2 mb-3">
                          {order.restaurant?.phone && (
                            <a
                              href={`tel:${order.restaurant.phone}`}
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              Zavolať prevádzke
                            </a>
                          )}
                          {order.customer?.phone && (
                            <a
                              href={`tel:${order.customer.phone}`}
                              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                            >
                              <Phone className="h-3 w-3" />
                              Zavolať zákazníkovi
                            </a>
                          )}
                        </div>

                        {/* Expandable items */}
                        <button
                          className="flex items-center gap-1 text-xs text-[#B42318] mb-3"
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

                        {/* Action buttons */}
                        {!isPickedUp ? (
                          <div className="space-y-2">
                            {/* Navigate to restaurant */}
                            {order.restaurant?.address && (
                              <a
                                href={`https://maps.google.com/?q=${encodeURIComponent(order.restaurant.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-11 text-sm font-semibold transition-colors"
                              >
                                <Navigation className="h-4 w-4" />
                                Navigovať do prevádzky
                              </a>
                            )}
                            {/* Pickup confirmation */}
                            <Button
                              className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11 text-sm font-semibold"
                              onClick={() => handlePickup(order.id)}
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Prevzal som objednávku
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Navigate to customer */}
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-11 text-sm font-semibold transition-colors"
                            >
                              <Navigation className="h-4 w-4" />
                              Navigovať k zákazníkovi
                            </a>
                            {/* Deliver button */}
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
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Available Orders Section */}
      <div className="max-w-lg mx-auto px-4 mt-6">
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Package className="h-4 w-4 text-[#B42318]" />
          Nová doručovacia úloha
          {availableOrders.length > 0 && (
            <Badge className="bg-[#B42318] text-white text-xs ml-1">
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
            <p className="text-gray-500 text-sm font-medium">Žiadne dostupné doručovacie úlohy</p>
            <p className="text-gray-400 text-xs mt-1">Nové úlohy sa zobrazia automaticky</p>
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

                      {/* City/Zone info */}
                      {(order.city || order.restaurant?.city) && (
                        <div className="flex items-center gap-1 text-xs text-[#B42318] font-medium mb-1">
                          <MapPin className="h-3 w-3" />
                          <span>{order.city || order.restaurant?.city}</span>
                        </div>
                      )}

                      <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        <span>{order.deliveryAddress}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{order.items?.length || 0} položiek</span>
                        {order.paymentMethod === 'cash' && (
                          <>
                            <span className="text-gray-300">·</span>
                            <Banknote className="h-3 w-3 text-amber-500" />
                            <span className="text-amber-600">Hotovosť</span>
                          </>
                        )}
                      </div>

                      {/* Cash payment note */}
                      {order.paymentMethod === 'cash' && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-amber-700">
                            Vybrať hotovosť pri prevzatí: <strong>{formatPrice(order.total)}</strong>
                          </p>
                        </div>
                      )}

                      {/* Expandable items */}
                      <button
                        className="flex items-center gap-1 text-xs text-[#B42318] mb-3"
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
                        className="w-full bg-[#B42318] hover:bg-[#8B1B12] text-white h-11 text-sm font-semibold"
                        onClick={() => acceptOrder(order.id)}
                        disabled={acceptingOrderId === order.id || !isAvailable}
                      >
                        {acceptingOrderId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Package className="h-4 w-4 mr-2" />
                        )}
                        Prijať doručenie
                      </Button>
                      {!isAvailable && acceptingOrderId !== order.id && (
                        <p className="text-xs text-center text-red-400 mt-1">
                          Zapnite dostupnosť na prijatie doručenia
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
