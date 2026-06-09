'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, CheckCircle2, Clock, MapPin, Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore, type Order } from '@/lib/store'
import { toast } from 'sonner'

function formatPrice(price: number) {
  return price.toFixed(2).replace('.', ',') + ' €'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const statusSteps = [
  { key: 'pending', label: 'Objednané', icon: Clock },
  { key: 'confirmed', label: 'Potvrdené', icon: CheckCircle2 },
  { key: 'preparing', label: 'Pripravuje sa', icon: Clock },
  { key: 'delivering', label: 'Na ceste', icon: MapPin },
  { key: 'delivered', label: 'Doručené', icon: CheckCircle2 },
]

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Čakajúca', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  confirmed: { label: 'Potvrdená', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  preparing: { label: 'Pripravuje sa', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  ready: { label: 'Pripravená', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  delivering: { label: 'Na ceste', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  delivered: { label: 'Doručená', color: 'text-green-700', bgColor: 'bg-green-100' },
  cancelled: { label: 'Zrušená', color: 'text-red-700', bgColor: 'bg-red-100' },
}

export default function OrderDetailView() {
  const { selectedOrderId, user, setView } = useAppStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  useEffect(() => {
    if (selectedOrderId && user) {
      fetchOrder()
    }
  }, [selectedOrderId, user])

  async function fetchOrder() {
    try {
      setLoading(true)
      const res = await fetch(`/api/orders?userId=${user!.id}`)
      if (res.ok) {
        const data = await res.json()
        const found = data.orders.find((o: Order) => o.id === selectedOrderId)
        if (found) {
          setOrder(found)
          if (found.review) {
            setReviewSubmitted(true)
            setReviewRating(found.review.rating)
            setReviewComment(found.review.comment || '')
          }
        }
      }
    } catch (err) {
      console.error('Error fetching order:', err)
    } finally {
      setLoading(false)
    }
  }

  async function submitReview() {
    if (reviewRating === 0) {
      toast.error('Vyberte hodnotenie')
      return
    }
    if (!order) return

    try {
      setSubmittingReview(true)
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          orderId: order.id,
          restaurantId: order.restaurant?.id,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setReviewSubmitted(true)
        toast.success('Ďakujeme za hodnotenie!')
      } else {
        toast.error(data.error || 'Chyba pri odosielaní hodnotenia')
      }
    } catch {
      toast.error('Chyba pri odosielaní hodnotenia')
    } finally {
      setSubmittingReview(false)
    }
  }

  function getStepIndex(status: string): number {
    if (status === 'cancelled') return -1
    const idx = statusSteps.findIndex((s) => s.key === status)
    return idx >= 0 ? idx : 0
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-60 rounded-xl" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-lg text-muted-foreground">Objednávka nenájdená</p>
        <Button className="mt-4" onClick={() => setView('orders')}>
          Späť na objednávky
        </Button>
      </div>
    )
  }

  const currentStep = getStepIndex(order.status)
  const status = statusConfig[order.status] || statusConfig.pending

  return (
    <div className="view-transition max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('orders')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Objednávka {order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Status Timeline */}
          {order.status !== 'cancelled' && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={`${status.bgColor} ${status.color} border-0`}>
                    {status.label}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  {statusSteps.map((step, index) => {
                    const Icon = step.icon
                    const isCompleted = index <= currentStep
                    const isCurrent = index === currentStep
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div className="flex items-center w-full">
                          <div
                            className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0 transition-colors ${
                              isCompleted
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-400'
                            } ${isCurrent ? 'ring-4 ring-orange-200' : ''}`}
                          >
                            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                          </div>
                          {index < statusSteps.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mx-1 ${
                                index < currentStep ? 'bg-orange-500' : 'bg-gray-200'
                              }`}
                            />
                          )}
                        </div>
                        <span className="text-xs mt-2 text-center hidden sm:block">
                          {step.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Položky objednávky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  {item.foodItem?.image && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-50 shrink-0">
                      <img
                        src={item.foodItem.image}
                        alt={item.foodItem.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.foodItem?.name || 'Položka'}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity}x</p>
                  </div>
                  <span className="font-medium text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Review Form */}
          {order.status === 'delivered' && !reviewSubmitted && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                  Ohodnoťte objednávku
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Hodnotenie</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`h-7 w-7 ${
                            star <= reviewRating
                              ? 'fill-orange-400 text-orange-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Komentár</p>
                  <Textarea
                    placeholder="Ako sa vám páčilo jedlo?"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>
                <Button
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={submitReview}
                  disabled={submittingReview || reviewRating === 0}
                >
                  Odoslať hodnotenie
                </Button>
              </CardContent>
            </Card>
          )}

          {reviewSubmitted && (
            <Card className="border-0 shadow-sm bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-700">Hodnotenie odoslané</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= reviewRating ? 'fill-orange-400 text-orange-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Summary */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Súhrn</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-2 mb-2">
                {order.restaurant?.logo && <span className="text-xl">{order.restaurant.logo}</span>}
                <span className="font-medium">{order.restaurant?.name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Medzisúčet</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doručovné</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Zľava</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Celkom</span>
                <span className="text-orange-600">{formatPrice(order.total)}</span>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground mb-1">Doručovacia adresa</p>
                <p className="font-medium">{order.deliveryAddress}</p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Platba</p>
                <p className="font-medium">
                  {order.paymentMethod === 'cash' ? '💵 Hotovosť' : '💳 Karta'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
