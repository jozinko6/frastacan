'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ChefHat,
  AlertCircle,
  Loader2,
  ShoppingBag,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatPrice, formatDate, statusConfig } from '@/lib/utils-shared'
import { toast } from 'sonner'
import VendorBottomNav from '@/components/vendor-bottom-nav'

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
  deliveryAddress: string
  createdAt: string
  customer?: { id: string; name: string; phone: string | null }
  items?: OrderItem[]
}

type OrderTab = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const tabs: { key: OrderTab; label: string; icon: string }[] = [
  { key: 'pending', label: 'Nové', icon: '🆕' },
  { key: 'confirmed', label: 'Potvrdené', icon: '✅' },
  { key: 'preparing', label: 'Pripravujú sa', icon: '👨‍🍳' },
  { key: 'ready', label: 'Pripravené', icon: '📦' },
  { key: 'delivered', label: 'Dokončené', icon: '✓' },
  { key: 'cancelled', label: 'Zrušené', icon: '✗' },
]

export default function VendorOrdersView() {
  const { setView } = useAppStore()
  const [activeTab, setActiveTab] = useState<OrderTab>('pending')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/vendor/orders')
      if (!res.ok) throw new Error('Chyba pri načítaní objednávok')
      const data = await res.json()
      setOrders(data.orders || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchOrders(), 30000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  async function updateOrderStatus(orderId: string, newStatus: string) {
    setActionLoading(orderId)
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok) {
        const statusMessages: Record<string, string> = {
          confirmed: 'Objednávka prijatá',
          cancelled: 'Objednávka odmietnutá',
          preparing: 'Objednávka sa pripravuje',
          ready: 'Objednávka je pripravená',
          delivering: 'Objednávka odovzdaná kuriérovi',
        }
        toast.success(statusMessages[newStatus] || 'Stav objednávky aktualizovaný')
        fetchOrders()
      } else {
        toast.error(data.error || 'Chyba pri aktualizácii stavu')
      }
    } catch {
      toast.error('Chyba pri aktualizácii stavu')
    } finally {
      setActionLoading(null)
    }
  }

  function handleRefresh() {
    fetchOrders(true)
  }

  const filteredOrders = orders.filter((o) => o.status === activeTab)
  const tabCounts = tabs.reduce((acc, tab) => {
    acc[tab.key] = orders.filter((o) => o.status === tab.key).length
    return acc
  }, {} as Record<string, number>)

  // Loading skeletons
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-emerald-600 px-4 pt-6 pb-4">
          <Skeleton className="h-7 w-40 bg-emerald-400/30 mb-4" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-8 w-20 bg-emerald-400/30 rounded-full" />
            ))}
          </div>
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <VendorBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Objednávky
            </h1>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-full bg-emerald-400/30 text-white hover:bg-emerald-400/50 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  activeTab === tab.key
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'bg-emerald-500/40 text-white/80 hover:bg-emerald-500/60'
                )}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tabCounts[tab.key] > 0 && (
                  <span
                    className={cn(
                      'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold',
                      activeTab === tab.key
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-white/20 text-white'
                    )}
                  >
                    {tabCounts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        {error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Skúsiť znova
            </Button>
          </motion.div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Žiadne objednávky v tejto kategórii</p>
            <p className="text-gray-400 text-xs mt-1">Nové objednávky sa zobrazia automaticky</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredOrders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending
                const isLoading = actionLoading === order.id

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      'border-0 shadow-md overflow-hidden',
                      order.status === 'pending' && 'border-l-4 border-l-yellow-400'
                    )}>
                      <CardContent className="p-4">
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-sm">#{order.orderNumber}</p>
                              <Badge className={`${status.bgColor} ${status.color} hover:${status.bgColor} text-xs border-0`}>
                                {status.icon} {status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {order.customer?.name || 'Neznámy zákazník'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatPrice(order.total)}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end">
                              <Clock className="h-3 w-3" />
                              {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Expandable items */}
                        <button
                          className="flex items-center gap-1 text-xs text-emerald-600 mb-2"
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
                              className="overflow-hidden mb-2"
                            >
                              <div className="bg-gray-50 rounded-lg p-2.5 space-y-1">
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

                        {/* Notes */}
                        {order.notes && (
                          <div className="bg-gray-50 rounded-lg p-2 mb-2">
                            <p className="text-xs text-gray-500">
                              <span className="font-medium">Poznámka:</span> {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Info banner for pending */}
                        {order.status === 'pending' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-3">
                            <p className="text-xs text-yellow-700">
                              Prišla nová objednávka. Potvrďte ju a nastavte približný čas prípravy.
                            </p>
                          </div>
                        )}

                        {/* Action buttons based on status */}
                        <div className="flex gap-2 mt-2">
                          {order.status === 'pending' && (
                            <>
                              <Button
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-10 text-sm font-semibold"
                                onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                                )}
                                Prijať
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-10 text-sm font-semibold"
                                onClick={() => {
                                  if (confirm('Objednávku odmietnite iba v prípade, že ju neviete pripraviť alebo nemáte dostupné položky.')) {
                                    updateOrderStatus(order.id, 'cancelled')
                                  }
                                }}
                                disabled={isLoading}
                              >
                                <XCircle className="h-4 w-4 mr-1.5" />
                                Odmietnuť
                              </Button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <Button
                              className="flex-1 bg-primary hover:bg-primary/90 text-white h-10 text-sm font-semibold"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              ) : (
                                <ChefHat className="h-4 w-4 mr-1.5" />
                              )}
                              Začať pripravovať
                            </Button>
                          )}
                          {order.status === 'preparing' && (
                            <Button
                              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-10 text-sm font-semibold"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              ) : (
                                <Package className="h-4 w-4 mr-1.5" />
                              )}
                              Označiť ako pripravené
                            </Button>
                          )}
                          {order.status === 'ready' && (
                            <Button
                              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white h-10 text-sm font-semibold"
                              onClick={() => updateOrderStatus(order.id, 'delivering')}
                              disabled={isLoading}
                            >
                              {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                              )}
                              Odovzdané kuriérovi
                            </Button>
                          )}
                        </div>
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
