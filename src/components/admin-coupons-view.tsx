'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tag, Plus, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { formatPrice, formatDate } from '@/lib/utils-shared'
import { toast } from 'sonner'

interface Coupon {
  id: string
  code: string
  discount: number
  minOrder: number
  maxDiscount: number | null
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export default function AdminCouponsView() {
  const { user, setView } = useAppStore()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formDiscount, setFormDiscount] = useState('')
  const [formMinOrder, setFormMinOrder] = useState('')
  const [formMaxDiscount, setFormMaxDiscount] = useState('')
  const [formExpiresAt, setFormExpiresAt] = useState('')

  const fetchCoupons = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons)
      } else {
        toast.error('Chyba pri načítaní kupónov')
      }
    } catch {
      toast.error('Chyba pri načítaní kupónov')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCoupons()
    }
  }, [user, fetchCoupons])

  async function toggleActive(couponId: string, currentActive: boolean) {
    try {
      setTogglingId(couponId)
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ couponId, isActive: !currentActive }),
      })
      if (res.ok) {
        const data = await res.json()
        setCoupons((prev) =>
          prev.map((c) => (c.id === couponId ? { ...c, isActive: data.coupon.isActive } : c))
        )
        toast.success(
          !currentActive ? 'Kupón aktivovaný' : 'Kupón deaktivovaný'
        )
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri aktualizácii')
      }
    } catch {
      toast.error('Chyba pri aktualizácii')
    } finally {
      setTogglingId(null)
    }
  }

  async function createCoupon() {
    if (!formCode.trim() || !formDiscount) {
      toast.error('Kód a zľava sú povinné')
      return
    }

    try {
      setCreating(true)
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formCode.trim(),
          discount: parseFloat(formDiscount),
          minOrder: formMinOrder ? parseFloat(formMinOrder) : 0,
          maxDiscount: formMaxDiscount ? parseFloat(formMaxDiscount) : null,
          expiresAt: formExpiresAt || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setCoupons((prev) => [data.coupon, ...prev])
        toast.success('Kupón vytvorený')
        setDialogOpen(false)
        resetForm()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri vytváraní kupónu')
      }
    } catch {
      toast.error('Chyba pri vytváraní kupónu')
    } finally {
      setCreating(false)
    }
  }

  function resetForm() {
    setFormCode('')
    setFormDiscount('')
    setFormMinOrder('')
    setFormMaxDiscount('')
    setFormExpiresAt('')
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6 text-primary" />
          Správa kupónov
        </h1>
        <div className="flex-1" />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="h-4 w-4" />
              Nový kupón
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vytvoriť nový kupón</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Kód *</label>
                <Input
                  placeholder="napr. ZLAVA10"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Zľava % *</label>
                  <Input
                    type="number"
                    placeholder="10"
                    min="0"
                    max="100"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Max. zľava (€)</label>
                  <Input
                    type="number"
                    placeholder="5.00"
                    step="0.01"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Min. objednávka (€)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Platnosť do</label>
                  <Input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Zrušiť
              </Button>
              <Button
                onClick={createCoupon}
                disabled={creating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {creating ? 'Vytváram...' : 'Vytvoriť kupón'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchCoupons}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Zatiaľ žiadne kupóny</p>
            <Button
              size="sm"
              className="mt-3 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Vytvoriť prvý kupón
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kód</TableHead>
                  <TableHead>Zľava %</TableHead>
                  <TableHead className="hidden sm:table-cell">Min. objednávka</TableHead>
                  <TableHead className="hidden sm:table-cell">Max. zľava</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="hidden md:table-cell">Platnosť</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const expired = isExpired(c.expiresAt)
                  return (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className="font-mono font-bold text-primary">{c.code}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary border-0">
                          {c.discount}%
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {formatPrice(c.minOrder)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {c.maxDiscount ? formatPrice(c.maxDiscount) : '—'}
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <Badge className="bg-gray-100 text-gray-600 border-0">Expirovaný</Badge>
                        ) : c.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-0">Aktívny</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 border-0">Neaktívny</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        {c.expiresAt ? (
                          <span className={`flex items-center gap-1 ${expired ? 'text-red-500' : ''}`}>
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(c.expiresAt)}
                          </span>
                        ) : (
                          'Bez obmedzenia'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Switch
                          checked={c.isActive && !expired}
                          disabled={togglingId === c.id || expired}
                          onCheckedChange={() => toggleActive(c.id, c.isActive)}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
