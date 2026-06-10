'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingBag,
  Phone,
  Navigation,
  Banknote,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { formatPrice, formatDate, statusConfig, authFetch } from '@/lib/utils-shared'
import { toast } from 'sonner'
import RiderBottomNav from '@/components/rider-bottom-nav'

type FilterTab = 'all' | 'active' | 'delivered'

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

const tabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Všetky' },
  { key: 'active', label: 'Aktívne' },
  { key: 'delivered', label: 'Doručené' },
]

export default function RiderOrdersView() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [deliveringOrderId, setDeliveringOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`
      const res = await authFetch(`/api/rider/my-orders${statusParam}`)
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Chyba pri načítaní objednávok')
      }
      const data = await res.json()
      setOrders(data.orders || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  async function deliverOrder(orderId: string) {
    setDeliveringOrderId(orderId)
    try {
      const res = await authFetch('/api/rider/deliver-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Objednávka doručená!')
        fetchOrders()
      } else {
        toast.error(data.error || 'Chyba pri označovaní objednávky')
      }
    } catch {
      toast.error('Chyba pri označovaní objednávky')
    } finally {
      setDeliveringOrderId(null)
    }
  }

  // Loading skeletons
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-[#B42318] px-4 pt-6 pb-4 rounded-b-3xl">
          <Skeleton className="h-7 w-36 bg-white/20 mb-3" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-9 w-20 bg-white/15 rounded-full" />
            ))}
          </div>
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <RiderBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-[#B42318] px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-white text-xl font-bold">Objednávky</h1>
            <button
              onClick={() => fetchOrders(true)}
              className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Tab filters */}
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-[#B42318] shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="max-w-lg mx-auto px-4 mt-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchOrders()} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
              <RefreshCw className="h-4 w-4" />
              Skúsiť znova
            </Button>
          </motion.div>
        </div>
      )}

      {/* Orders list */}
      {!error && (
        <div className="max-w-lg mx-auto px-4 mt-4">
          {orders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {activeTab === 'active'
                  ? 'Žiadne aktívne doručenia'
                  : activeTab === 'delivered'
                  ? 'Žiadne doručené objednávky'
                  : 'Žiadne objednávky'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {activeTab === 'active'
                  ? 'Prijaťte doručenie z domovskej obrazovky'
                  : 'Začnite doručovať a objednávky sa zobrazia tu'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {orders.map((order, index) => {
                  const sc = statusConfig[order.status]
                  const isDelivering = order.status === 'delivering'
                  const isExpanded = expandedOrder === order.id
                  const isCashPayment = order.paymentMethod === 'cash'

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ delay: index * 0.03 }}
                      layout
                    >
                      <Card
                        className={cn(
                          'border-0 shadow-md overflow-hidden',
                          isDelivering && 'border-l-4 border-l-[#B42318]'
                        )}
                      >
                        <CardContent className="p-4">
                          {/* Order header */}
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {order.restaurant?.logo || '🏪'}
                              </span>
                              <div>
                                <p className="font-semibold text-sm">
                                  {order.restaurant?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  #{order.orderNumber}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={cn(
                                  'text-xs',
                                  sc?.bgColor,
                                  sc?.color
                                )}
                              >
                                {sc?.icon} {sc?.label}
                              </Badge>
                            </div>
                          </div>

                          {/* City/Zone info */}
                          {(order.city || order.restaurant?.city) && (
                            <div className="flex items-center gap-1 text-xs text-[#B42318] font-medium mb-1">
                              <MapPin className="h-3 w-3" />
                              <span>{order.city || order.restaurant?.city}</span>
                            </div>
                          )}

                          {/* Address */}
                          <div className="flex items-start gap-1.5 text-xs text-gray-500 mb-1">
                            <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{order.deliveryAddress}</span>
                          </div>

                          {/* Date and amount */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-sm">
                                {formatPrice(order.total)}
                              </p>
                              {order.deliveryFee > 0 && (
                                <p className="text-xs text-green-600">
                                  +{formatPrice(order.deliveryFee)} poplatok
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Expand toggle */}
                          <button
                            className="flex items-center gap-1 text-xs text-[#B42318] mt-2"
                            onClick={() =>
                              setExpandedOrder(isExpanded ? null : order.id)
                            }
                          >
                            <ShoppingBag className="h-3 w-3" />
                            {order.items?.length || 0} položiek
                            {isExpanded ? (
                              <ChevronUp className="h-3 w-3" />
                            ) : (
                              <ChevronDown className="h-3 w-3" />
                            )}
                          </button>

                          {/* Expanded details */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="bg-gray-50 rounded-lg p-3 mt-2 space-y-1.5">
                                  {order.items?.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex justify-between text-xs"
                                    >
                                      <span className="text-gray-600">
                                        {item.quantity}x{' '}
                                        {item.foodItem?.name}
                                      </span>
                                      <span className="text-gray-500">
                                        {formatPrice(
                                          item.price * item.quantity
                                        )}
                                      </span>
                                    </div>
                                  ))}

                                  {/* Cash payment info */}
                                  {isCashPayment && isDelivering && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                                        <div className="flex items-center gap-1.5 mb-1">
                                          <Banknote className="h-3.5 w-3.5 text-amber-600" />
                                          <span className="text-xs font-semibold text-amber-700">Vybrať hotovosť pri prevzatí</span>
                                        </div>
                                        <p className="text-xs text-amber-700">
                                          Zákazník platí hotovosťou. Vyberte sumu <strong>{formatPrice(order.total)}</strong> pri odovzdaní objednávky.
                                        </p>
                                      </div>
                                    </div>
                                  )}

                                  {order.customer && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                      <p className="text-xs text-gray-500">
                                        Zákazník:{' '}
                                        <span className="font-medium text-gray-700">
                                          {order.customer.name}
                                        </span>
                                      </p>
                                      {order.customer.phone && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                          Tel:{' '}
                                          <span className="font-medium text-gray-700">
                                            {order.customer.phone}
                                          </span>
                                        </p>
                                      )}
                                    </div>
                                  )}

                                  {order.notes && (
                                    <div className="pt-2 mt-2 border-t border-gray-200">
                                      <p className="text-xs text-gray-500">
                                        Poznámka:{' '}
                                        <span className="text-gray-700">
                                          {order.notes}
                                        </span>
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Contact and deliver buttons for active orders */}
                                {isDelivering && (
                                  <div className="mt-3 space-y-2">
                                    {/* Contact buttons */}
                                    <div className="flex gap-2">
                                      {order.restaurant?.phone && (
                                        <a
                                          href={`tel:${order.restaurant.phone}`}
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                                        >
                                          <Phone className="h-3 w-3" />
                                          Zavolať prevádzke
                                        </a>
                                      )}
                                      {order.customer?.phone && (
                                        <a
                                          href={`tel:${order.customer.phone}`}
                                          className="flex-1 flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                                        >
                                          <Phone className="h-3 w-3" />
                                          Zavolať zákazníkovi
                                        </a>
                                      )}
                                    </div>

                                    {/* Navigate to customer */}
                                    {order.deliveryAddress && (
                                      <a
                                        href={`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors"
                                      >
                                        <Navigation className="h-4 w-4" />
                                        Navigovať k zákazníkovi
                                      </a>
                                    )}

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
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      <RiderBottomNav />
    </div>
  )
}
