'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Settings,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  Truck,
  DollarSign,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils-shared'
import { toast } from 'sonner'
import VendorBottomNav from '@/components/vendor-bottom-nav'

interface RestaurantInfo {
  id: string
  name: string
  description: string
  image: string
  logo: string | null
  address: string
  city: string
  phone: string | null
  email: string | null
  cuisine: string
  deliveryType: string
  minimumOrder: number
  deliveryFee: number
  openingHours: string | null
  isAvailable: boolean
}

interface SettingsForm {
  name: string
  description: string
  phone: string
  email: string
  address: string
  city: string
  openingHours: string
  deliveryType: string
  cuisine: string
  minimumOrder: string
  deliveryFee: string
}

export default function VendorSettingsView() {
  const { user } = useAppStore()
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null)
  const [form, setForm] = useState<SettingsForm>({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    openingHours: '',
    deliveryType: 'delivery',
    cuisine: '',
    minimumOrder: '0',
    deliveryFee: '0',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await fetch('/api/vendor')
      if (!res.ok) throw new Error('Chyba pri načítaní prevádzky')
      const data = await res.json()
      setRestaurant(data.restaurant)
      setForm({
        name: data.restaurant.name || '',
        description: data.restaurant.description || '',
        phone: data.restaurant.phone || '',
        email: data.restaurant.email || '',
        address: data.restaurant.address || '',
        city: data.restaurant.city || '',
        openingHours: data.restaurant.openingHours || '',
        deliveryType: data.restaurant.deliveryType || 'delivery',
        cuisine: data.restaurant.cuisine || '',
        minimumOrder: data.restaurant.minimumOrder?.toString() || '0',
        deliveryFee: data.restaurant.deliveryFee?.toString() || '0',
      })
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  async function handleSave() {
    if (!form.name.trim()) {
      toast.error('Názov prevádzky je povinný')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/vendor', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          address: form.address.trim(),
          city: form.city.trim(),
          openingHours: form.openingHours.trim() || null,
          deliveryType: form.deliveryType,
          cuisine: form.cuisine.trim(),
          minimumOrder: parseFloat(form.minimumOrder) || 0,
          deliveryFee: parseFloat(form.deliveryFee) || 0,
        }),
      })

      if (res.ok) {
        toast.success('Nastavenia uložené')
        fetchRestaurant()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri ukladaní')
      }
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-emerald-600 px-4 pt-6 pb-4">
          <Skeleton className="h-7 w-40 bg-emerald-400/30" />
        </div>
        <div className="px-4 mt-4 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
        <VendorBottomNav />
      </div>
    )
  }

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
          <Button onClick={fetchRestaurant} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <VendorBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 px-4 pt-6 pb-4 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white text-lg font-bold flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Nastavenia prevádzky
          </h1>
          <p className="text-emerald-100 text-sm mt-1">{restaurant?.name}</p>
        </div>
      </div>

      {/* Settings Form */}
      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {/* Basic Info */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
              <Store className="h-4 w-4 text-emerald-600" />
              Základné informácie
            </h3>

            <div>
              <Label htmlFor="name">Názov prevádzky *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Názov prevádzky"
              />
            </div>

            <div>
              <Label htmlFor="description">Popis</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Popis prevádzky"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="cuisine">Typ kuchyne</Label>
              <Input
                id="cuisine"
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                placeholder="napr. Slovenská, Talianska"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
              <Phone className="h-4 w-4 text-emerald-600" />
              Kontakt
            </h3>

            <div>
              <Label htmlFor="phone">Telefón</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+421 9XX XXX XXX"
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="prevadzka@email.sk"
              />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-emerald-600" />
              Adresa
            </h3>

            <div>
              <Label htmlFor="address">Ulica a číslo</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Hlavná 1"
              />
            </div>

            <div>
              <Label htmlFor="city">Mesto</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="Hlohovec"
              />
            </div>
          </CardContent>
        </Card>

        {/* Opening Hours */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-emerald-600" />
              Otváracie hodiny
            </h3>

            <div>
              <Label htmlFor="openingHours">Otváracie hodiny</Label>
              <Textarea
                id="openingHours"
                value={form.openingHours}
                onChange={(e) => setForm({ ...form, openingHours: e.target.value })}
                placeholder={"Po - Pi: 10:00 - 22:00\nSo: 11:00 - 23:00\nNe: 11:00 - 21:00"}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Delivery Settings */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-sm flex items-center gap-2 text-gray-700">
              <Truck className="h-4 w-4 text-emerald-600" />
              Doručovanie
            </h3>

            <div>
              <Label htmlFor="deliveryType">Typ doručenia</Label>
              <select
                id="deliveryType"
                value={form.deliveryType}
                onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="delivery">Doručenie</option>
                <option value="pickup">Osobný odber</option>
                <option value="both">Oboje</option>
              </select>
            </div>

            <div>
              <Label htmlFor="minimumOrder">Minimálna objednávka (€)</Label>
              <Input
                id="minimumOrder"
                type="number"
                step="0.01"
                value={form.minimumOrder}
                onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="deliveryFee">Doručovací poplatok (€)</Label>
              <Input
                id="deliveryFee"
                type="number"
                step="0.01"
                value={form.deliveryFee}
                onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base font-semibold"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <Save className="h-5 w-5 mr-2" />
          )}
          Uložiť nastavenia
        </Button>

        <div className="h-4" />
      </div>

      <VendorBottomNav />
    </div>
  )
}
