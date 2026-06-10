'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, RefreshCw, Pencil, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils-shared'
import { toast } from 'sonner'

const zoneTypeLabels: Record<string, string> = {
  municipal: 'Mestská',
  suburban: 'Prímestská',
  village: 'Vidiecka',
}

const zoneTypeColors: Record<string, string> = {
  municipal: 'bg-blue-100 text-blue-700',
  suburban: 'bg-green-100 text-green-700',
  village: 'bg-amber-100 text-amber-700',
}

interface Zone {
  id: string
  name: string
  type: string
  baseFee: number
  minimumOrder: number
  estimatedMin: number
  estimatedMax: number
  radiusKm: number
  centerLat: number
  centerLng: number
  isActive: boolean
  createdAt: string
  _count: { restaurants: number }
}

export default function AdminZonesView() {
  const { user, setView } = useAppStore()
  const [zones, setZones] = useState<Zone[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const fetchZones = useCallback(async () => {
    try {
      setRefreshing(true)
      const res = await fetch('/api/admin/zones')
      if (res.ok) {
        const data = await res.json()
        setZones(data.zones)
      } else {
        toast.error('Chyba pri načítaní zón')
      }
    } catch {
      toast.error('Chyba pri načítaní zón')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchZones()
    }
  }, [user, fetchZones])

  async function toggleActive(zoneId: string, currentActive: boolean) {
    try {
      setTogglingId(zoneId)
      const res = await fetch('/api/admin/zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId, isActive: !currentActive }),
      })
      if (res.ok) {
        const data = await res.json()
        setZones((prev) =>
          prev.map((z) => (z.id === zoneId ? { ...z, ...data.zone } : z))
        )
        toast.success(!currentActive ? 'Zóna aktivovaná' : 'Zóna deaktivovaná')
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

  function startEditing(zone: Zone) {
    setEditingId(zone.id)
    setEditForm({
      name: zone.name,
      type: zone.type,
      baseFee: String(zone.baseFee),
      minimumOrder: String(zone.minimumOrder),
      estimatedMin: String(zone.estimatedMin),
      estimatedMax: String(zone.estimatedMax),
      radiusKm: String(zone.radiusKm),
    })
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm({})
  }

  async function saveEditing() {
    if (!editingId) return
    try {
      const res = await fetch('/api/admin/zones', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneId: editingId, ...editForm }),
      })
      if (res.ok) {
        const data = await res.json()
        setZones((prev) =>
          prev.map((z) => (z.id === editingId ? { ...z, ...data.zone } : z))
        )
        toast.success('Zóna aktualizovaná')
        cancelEditing()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri aktualizácii')
      }
    } catch {
      toast.error('Chyba pri aktualizácii')
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Doručovacie zóny
        </h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchZones}
          disabled={refreshing}
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : zones.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">Zatiaľ žiadne doručovacie zóny</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {zones.map((zone) => {
            const isEditing = editingId === zone.id
            return (
              <Card key={zone.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      {isEditing ? (
                        <Input
                          value={editForm.name || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                          className="font-bold text-lg h-8 w-48"
                        />
                      ) : (
                        <h3 className="font-bold text-lg">{zone.name}</h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {isEditing ? (
                          <Select
                            value={editForm.type || zone.type}
                            onValueChange={(v) => setEditForm((p) => ({ ...p, type: v }))}
                          >
                            <SelectTrigger className="h-7 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="municipal">Mestská</SelectItem>
                              <SelectItem value="suburban">Prímestská</SelectItem>
                              <SelectItem value="village">Vidiecka</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge className={`${zoneTypeColors[zone.type] || 'bg-gray-100 text-gray-700'} border-0`}>
                            {zoneTypeLabels[zone.type] || zone.type}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {zone._count.restaurants} prevádzok
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEditing}>
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEditing}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Switch
                            checked={zone.isActive}
                            disabled={togglingId === zone.id}
                            onCheckedChange={() => toggleActive(zone.id, zone.isActive)}
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60" onClick={() => startEditing(zone)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Poplatok</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.baseFee || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, baseFee: e.target.value }))}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <p className="font-medium">{formatPrice(zone.baseFee)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Min. objednávka</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          value={editForm.minimumOrder || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, minimumOrder: e.target.value }))}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <p className="font-medium">{formatPrice(zone.minimumOrder)}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Odhad doručenia</p>
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={editForm.estimatedMin || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, estimatedMin: e.target.value }))}
                            className="h-7 text-sm w-14"
                          />
                          <span>-</span>
                          <Input
                            type="number"
                            value={editForm.estimatedMax || ''}
                            onChange={(e) => setEditForm((p) => ({ ...p, estimatedMax: e.target.value }))}
                            className="h-7 text-sm w-14"
                          />
                          <span className="text-xs">min</span>
                        </div>
                      ) : (
                        <p className="font-medium">{zone.estimatedMin}–{zone.estimatedMax} min</p>
                      )}
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Radius</p>
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.1"
                          value={editForm.radiusKm || ''}
                          onChange={(e) => setEditForm((p) => ({ ...p, radiusKm: e.target.value }))}
                          className="h-7 text-sm"
                        />
                      ) : (
                        <p className="font-medium">{zone.radiusKm} km</p>
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
