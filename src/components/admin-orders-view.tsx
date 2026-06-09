'use client'

import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Package, ChevronDown, ChevronLeft, ChevronRight, Phone, Bike } from 'lucide-react'
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
import { formatPrice, formatDate, statusConfig, nextStatuses, paymentStatusConfig } from '@/lib/utils-shared'
import { toast } from 'sonner'

const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled']

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

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminOrdersView() {
  const { user, setView } = useAppStore()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 1 })

  const fetchOrders = useCallback(async (page?: number) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (page) params.set('page', String(page))
      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      } else {
        toast.error('Chyba pri načítaní objednávok')
      }
    } catch {
      toast.error('Chyba pri načítaní objednávok')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchOrders(1)
    }
  }, [user, statusFilter, fetchOrders])

  async function updateStatus(orderId: string, currentStatus: string, newStatus: string) {
    // Validate status transition
    if (!validStatuses.includes(newStatus)) {
      toast.error('Neplatný stav objednávky')
      return
    }
    const allowed = nextStatuses[currentStatus]
    if (!allowed || !allowed.includes(newStatus)) {
      toast.error(`Zmena z "${statusConfig[currentStatus]?.label || currentStatus}" na "${statusConfig[newStatus]?.label || newStatus}" nie je povolená`)
      return
    }

    try {
      setUpdatingId(orderId)
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast.success(`Stav zmenený na: ${statusConfig[newStatus]?.label || newStatus}`)
        fetchOrders(pagination.page)
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
          <Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Žiadne objednávky</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const config = statusConfig[order.status] || statusConfig.pending
              const payConfig = paymentStatusConfig[order.paymentStatus] || paymentStatusConfig.pending
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
                          <Badge className={`${payConfig.bgColor} ${payConfig.color} border-0 text-xs`}>
                            {payConfig.label}
                          </Badge>
                        </div>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Zákazník:</span>{' '}
                            {order.customer?.name}
                          </p>
                          <p>
                            <span className="text-muted-foreground">Reštaurácia:</span>{' '}
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

                        {/* Rider info */}
                        {order.rider && (
                          <div className="mt-2 flex items-center gap-2 text-sm">
                            <Bike className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Kuriér:</span>
                            <span className="font-medium">{order.rider.name}</span>
                            {order.rider.phone && (
                              <a
                                href={`tel:${order.rider.phone}`}
                                className="inline-flex items-center gap-1 text-orange-600 hover:underline"
                              >
                                <Phone className="h-3 w-3" />
                                {order.rider.phone}
                              </a>
                            )}
                          </div>
                        )}

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
                                    onClick={() => updateStatus(order.id, order.status, nextStatus)}
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Predošlá
              </Button>
              <span className="text-sm text-muted-foreground px-3">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="gap-1"
              >
                Ďalšia
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
