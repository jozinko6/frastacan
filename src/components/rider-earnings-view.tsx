'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  ArrowDownToLine,
  RefreshCw,
  AlertCircle,
  Package,
  Calendar,
  Banknote,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { formatPrice, formatDateShort, authFetchOrLogout } from '@/lib/utils-shared'
import { toast } from 'sonner'
import RiderBottomNav from '@/components/rider-bottom-nav'

interface EarningsData {
  totalEarnings: number
  walletBalance: number
  totalDeliveries: number
  rating: number
  reviewCount: number
  earningsByDay: Record<string, number>
  deliveryCountByDay: Record<string, number>
  recentDeliveries: {
    id: string
    orderNumber: string
    deliveryFee: number
    total: number
    paymentMethod: string
    deliveredAt: string | null
    restaurant: {
      id: string
      name: string
      logo: string | null
    }
  }[]
}

export default function RiderEarningsView() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await authFetchOrLogout('/api/rider/earnings')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Chyba pri načítaní zárobkov')
      }
      const earningsData = await res.json()
      setData(earningsData)
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

  function handleWithdraw() {
    toast.info('Funkcia bude dostupná čoskoro')
  }

  // Calculate today's earnings from earningsByDay
  const todayKey = new Date().toISOString().split('T')[0]
  const todaysEarnings = data?.earningsByDay?.[todayKey] ?? 0

  // Calculate total cash to collect from recent cash deliveries
  const cashToCollect = data?.recentDeliveries
    ?.filter((d) => d.paymentMethod === 'cash')
    .reduce((sum, d) => sum + d.total, 0) ?? 0

  // Get max earning for chart scaling
  const chartDays = data?.earningsByDay
    ? Object.entries(data.earningsByDay).sort(([a], [b]) => a.localeCompare(b))
    : []
  const maxEarning = chartDays.length > 0
    ? Math.max(...chartDays.map(([, v]) => v), 1)
    : 1

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
          <Skeleton className="h-7 w-28 bg-white/20 mb-4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-24 bg-white/10 rounded-xl" />
            <Skeleton className="h-24 bg-white/10 rounded-xl" />
          </div>
        </div>
        <div className="px-4 mt-4 space-y-3">
          <Skeleton className="h-40 bg-gray-200 rounded-xl" />
          <Skeleton className="h-10 bg-gray-200 rounded-xl" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 bg-gray-200 rounded-xl" />
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
          <Button onClick={() => fetchData()} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <RiderBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with main earnings */}
      <div className="bg-primary px-4 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white text-xl font-bold">Zárobky</h1>
            <button
              onClick={() => fetchData(true)}
              className="p-2 rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-5 w-5', refreshing && 'animate-spin')} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-red-200" />
                <span className="text-red-200 text-xs">Celkové zárobky</span>
              </div>
              <p className="text-white text-xl font-bold">
                {formatPrice(data?.totalEarnings ?? 0)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/15 backdrop-blur-sm rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-red-200" />
                <span className="text-red-200 text-xs">Peňaženka</span>
              </div>
              <p className="text-white text-xl font-bold">
                {formatPrice(data?.walletBalance ?? 0)}
              </p>
            </motion.div>
          </div>

          {/* Today's earnings highlight */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-3 bg-white rounded-xl p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-muted-foreground">Dnešné zárobky</p>
              <p className="text-2xl font-bold text-primary">
                {formatPrice(todaysEarnings)}
              </p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </motion.div>

          {/* Cash to collect info */}
          {cashToCollect > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3"
            >
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Vybrať hotovosť pri prevzatí</p>
                  <p className="text-xs text-amber-700">
                    Zákazník platí hotovosťou. Vyberte sumu <strong>{formatPrice(cashToCollect)}</strong> pri odovzdaní objednávky.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* 7-day chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-4">Posledných 7 dní</h3>

              {/* Bar chart using divs */}
              <div className="flex items-end gap-2 h-32">
                {chartDays.map(([dayKey, earning]) => {
                  const date = new Date(dayKey + 'T12:00:00')
                  const dayLabel = date.toLocaleDateString('sk-SK', {
                    weekday: 'short',
                  })
                  const isToday = dayKey === todayKey
                  const barHeight = Math.max(
                    (earning / maxEarning) * 100,
                    earning > 0 ? 8 : 2
                  )

                  return (
                    <div
                      key={dayKey}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-500 font-medium">
                        {earning > 0 ? formatPrice(earning).replace(' €', '') : ''}
                      </span>
                      <div className="w-full flex justify-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${barHeight}%` }}
                          transition={{ duration: 0.5, delay: 0.1 }}
                          className={cn(
                            'w-full max-w-[28px] rounded-t-md transition-colors',
                            isToday
                              ? 'bg-primary'
                              : earning > 0
                              ? 'bg-primary/40'
                              : 'bg-gray-200'
                          )}
                          style={{ minHeight: earning > 0 ? 4 : 2 }}
                        />
                      </div>
                      <span
                        className={cn(
                          'text-[10px]',
                          isToday
                            ? 'text-primary font-bold'
                            : 'text-gray-400'
                        )}
                      >
                        {dayLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Withdrawal button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-white h-12 text-sm font-semibold gap-2"
            onClick={handleWithdraw}
          >
            <ArrowDownToLine className="h-4 w-4" />
            Vybrať prostriedky
          </Button>
        </motion.div>

        {/* Recent deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="font-semibold text-sm mb-3">Posledné doručenia</h3>

          {!data?.recentDeliveries || data.recentDeliveries.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Package className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm">Zatiaľ žiadne doručenia</p>
              <p className="text-gray-400 text-xs mt-1">
                Začnite doručovať a vaše zárobky sa zobrazia tu
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              {data.recentDeliveries.map((delivery, index) => (
                <motion.div
                  key={delivery.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-base">
                          {delivery.restaurant?.logo || '🏪'}
                        </span>
                        <div>
                          <p className="font-medium text-sm">
                            {delivery.restaurant?.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {delivery.deliveredAt
                                ? formatDateShort(delivery.deliveredAt)
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm text-green-600">
                          +{formatPrice(delivery.deliveryFee)}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <span>#{delivery.orderNumber}</span>
                          {delivery.paymentMethod === 'cash' && (
                            <Banknote className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <RiderBottomNav />
    </div>
  )
}
