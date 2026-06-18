'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Package, Clock, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Order } from '@/lib/store'
import { authFetchOrLogout } from '@/lib/utils-shared'

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
  preparing: { label: 'Pripravuje sa', color: 'text-primary', bgColor: 'bg-primary/10' },
  ready: { label: 'Pripravená', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivering: { label: 'Na ceste', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: 'Doručená', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Zrušená', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export default function OrdersView() {
  const { user, setView, setSelectedOrder } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchOrders()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchOrders() {
    try {
      setLoading(true)
      const res = await authFetchOrLogout('/api/orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  function openOrder(orderId: string) {
    setSelectedOrder(orderId)
    setView('order-detail')
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center safe-area-x">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold mb-2">Prihláste sa</h2>
        <p className="text-muted-foreground mb-6">
          Pre zobrazenie objednávok sa musíte prihlásiť
        </p>
        <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setView('login')}>
          Prihlásiť sa
        </Button>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-4xl mx-auto px-4 py-6 safe-area-x">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 hover:bg-muted/60" onClick={() => setView('home')} aria-label="Späť">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Moje objednávky</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold mb-2">Zatiaľ žiadne objednávky</h2>
          <p className="text-muted-foreground mb-6">
            Objednajte si niečo chutné a objednávka sa zobrazí tu
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-white" onClick={() => setView('home')}>
            Objednať si jedlo
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const status = statusConfig[order.status] || statusConfig.pending
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openOrder(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm sm:text-base">{order.orderNumber}</span>
                          <Badge className={`${status.bgColor} ${status.color} border-0 text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {order.restaurant?.name || 'Reštaurácia'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary text-sm sm:text-base">{formatPrice(order.total)}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.items?.length || 0} položiek
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
