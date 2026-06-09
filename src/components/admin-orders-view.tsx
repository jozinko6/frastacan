'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Package, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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

const nextStatuses: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
}

interface AdminOrder {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  total: number
  deliveryAddress: string
  createdAt: string
  customer: { name: string; email: string; phone?: string | null }
  restaurant: { name: string; logo?: string | null }
  rider?: { name: string; phone?: string | null } | null
  items: { id: string; quantity: number; price: number; foodItem: { name: string; price: number } }[]
  review?: { rating: number } | null
}

export default function AdminOrdersView() {
  const { user, setView } = useAppStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders()
    }
  }, [user, statusFilter])

  async function fetchOrders() {
    try {
      setLoading(true)
      const url = statusFilter
        ? `/api/admin/orders?status=${statusFilter}`
        : '/api/admin/orders'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
      } else {
        toast.error('Chyba pri načítaní objednávok')
      }
    } catch {
      toast.error('Chyba pri načítaní objednávok')
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(orderId: string, newStatus: string) {
    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Stav zmenený na: ${statusConfig[newStatus]?.label || newStatus}`)
        fetchOrders()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri aktualizácii stavu')
      }
    } catch {
      toast.error('Chyba pri aktualizácii stavu')
    } finally {
      setUpdatingId(null)
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
        <h1 className="text-2xl font-bold">Správa objednávok</h1>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <Button
          variant={statusFilter === null ? 'default' : 'outline'}
          size="sm"
          className={`shrink-0 rounded-full ${statusFilter === null ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
          onClick={() => setStatusFilter(null)}
        >
          Všetky
        </Button>
        {Object.entries(statusConfig).map(([key, config]) => (
          <Button
            key={key}
            variant={statusFilter === key ? 'default' : 'outline'}
            size="sm"
            className={`shrink-0 rounded-full ${statusFilter === key ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}
            onClick={() => setStatusFilter(key)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Žiadne objednávky</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending
            const canUpdate = nextStatuses[order.status] && nextStatuses[order.status].length > 0

            return (
              <Card key={order.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold">{order.orderNumber}</span>
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          {config.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {order.paymentMethod === 'cash' ? '💵 Hotovosť' : '💳 Karta'}
                        </Badge>
                      </div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Zákazník:</span>{' '}
                          {order.customer?.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Reštaurácia:</span>{' '}
                          {order.restaurant?.logo && <span className="mr-1">{order.restaurant.logo}</span>}
                          {order.restaurant?.name}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Adresa:</span>{' '}
                          {order.deliveryAddress}
                        </p>
                        <p>
                          <span className="text-muted-foreground">Dátum:</span>{' '}
                          {formatDate(order.createdAt)}
                        </p>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {order.items.map((item) => (
                          <Badge key={item.id} variant="secondary" className="text-xs">
                            {item.quantity}x {item.foodItem?.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <p className="font-bold text-lg text-orange-600">{formatPrice(order.total)}</p>

                      {canUpdate && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-300 text-orange-700"
                              disabled={updatingId === order.id}
                            >
                              Zmeniť stav
                              <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {nextStatuses[order.status]?.map((nextStatus) => {
                              const nextConfig = statusConfig[nextStatus]
                              return (
                                <DropdownMenuItem
                                  key={nextStatus}
                                  onClick={() => updateStatus(order.id, nextStatus)}
                                >
                                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${nextConfig.bgColor}`} />
                                  {nextConfig.label}
                                </DropdownMenuItem>
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
