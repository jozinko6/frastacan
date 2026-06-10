'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  AlertCircle,
  RefreshCw,
  UtensilsCrossed,
  Tag,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { formatPrice } from '@/lib/utils-shared'
import { toast } from 'sonner'
import VendorBottomNav from '@/components/vendor-bottom-nav'

interface FoodItem {
  id: string
  name: string
  description: string | null
  image: string | null
  price: number
  discountPrice: number | null
  isAvailable: boolean
  isPopular: boolean
  categoryId: string
  restaurantId: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  sortOrder: number
  foodItems: FoodItem[]
}

interface FormData {
  name: string
  description: string
  price: string
  discountPrice: string
  isAvailable: boolean
  isPopular: boolean
  categoryId: string
}

const emptyForm: FormData = {
  name: '',
  description: '',
  price: '',
  discountPrice: '',
  isAvailable: true,
  isPopular: false,
  categoryId: '',
}

export default function VendorMenuView() {
  const { setView } = useAppStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [editId, setEditId] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/vendor/menu')
      if (!res.ok) throw new Error('Chyba pri načítaní menu')
      const data = await res.json()
      setCategories(data.categories || [])
      // Expand all categories by default
      setExpandedCategories(new Set((data.categories || []).map((c: Category) => c.id)))
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

  function toggleCategory(categoryId: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  async function toggleItemAvailability(item: FoodItem) {
    setTogglingId(item.id)
    try {
      const res = await fetch('/api/vendor/menu', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          isAvailable: !item.isAvailable,
        }),
      })
      if (res.ok) {
        toast.success(item.isAvailable ? 'Položka skrytá' : 'Položka zobrazená')
        fetchData()
      } else {
        toast.error('Chyba pri zmene dostupnosti')
      }
    } catch {
      toast.error('Chyba pri zmene dostupnosti')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleSaveItem() {
    if (!form.name.trim() || !form.price || !form.categoryId) {
      toast.error('Vyplňte názov, cenu a kategóriu')
      return
    }

    setSaving(true)
    try {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price: parseFloat(form.price),
        discountPrice: form.discountPrice ? parseFloat(form.discountPrice) : null,
        isAvailable: form.isAvailable,
        isPopular: form.isPopular,
        categoryId: form.categoryId,
      }

      const res = await fetch('/api/vendor/menu', {
        method: showEditItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showEditItem ? { ...body, id: editId } : body),
      })

      if (res.ok) {
        toast.success(showEditItem ? 'Položka aktualizovaná' : 'Položka pridaná')
        setShowAddItem(false)
        setShowEditItem(false)
        setForm(emptyForm)
        setEditId(null)
        fetchData()
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

  async function handleDeleteItem() {
    if (!deleteItemId) return
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/menu', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteItemId }),
      })
      if (res.ok) {
        toast.success('Položka odstránená')
        setDeleteItemId(null)
        fetchData()
      } else {
        toast.error('Chyba pri odstraňovaní')
      }
    } catch {
      toast.error('Chyba pri odstraňovaní')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) {
      toast.error('Zadajte názov kategórie')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/vendor/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      })
      if (res.ok) {
        toast.success('Kategória pridaná')
        setShowAddCategory(false)
        setNewCategoryName('')
        fetchData()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Chyba pri pridávaní kategórie')
      }
    } catch {
      toast.error('Chyba pri pridávaní kategórie')
    } finally {
      setSaving(false)
    }
  }

  function openEditItem(item: FoodItem) {
    setForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      discountPrice: item.discountPrice?.toString() || '',
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      categoryId: item.categoryId,
    })
    setEditId(item.id)
    setShowEditItem(true)
  }

  function openAddItem(categoryId: string) {
    setForm({ ...emptyForm, categoryId })
    setShowAddItem(true)
  }

  const totalItems = categories.reduce((sum, c) => sum + c.foodItems.length, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-emerald-600 px-4 pt-6 pb-4">
          <Skeleton className="h-7 w-32 bg-emerald-400/30" />
        </div>
        <div className="px-4 mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 bg-gray-200 rounded-xl" />
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-white text-lg font-bold flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5" />
              Menu
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchData(true)}
                className="p-2 rounded-full bg-emerald-400/30 text-white hover:bg-emerald-400/50 transition-colors"
                disabled={refreshing}
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </button>
              <button
                onClick={() => setShowAddCategory(true)}
                className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              >
                <Tag className="h-4 w-4" />
              </button>
            </div>
          </div>
          <p className="text-emerald-100 text-sm">
            {categories.length} kategórií • {totalItems} položiek
          </p>
        </div>
      </div>

      {/* Categories and Items */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchData(true)} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
              <RefreshCw className="h-4 w-4" />
              Skúsiť znova
            </Button>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UtensilsCrossed className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-gray-500 text-sm font-medium">Zatiaľ žiadne kategórie</p>
            <p className="text-gray-400 text-xs mt-1 mb-4">Pridajte prvú kategóriu</p>
            <Button
              onClick={() => setShowAddCategory(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Pridať kategóriu
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const isExpanded = expandedCategories.has(category.id)
              return (
                <Card key={category.id} className="border-0 shadow-md overflow-hidden">
                  {/* Category Header */}
                  <button
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCategory(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {category.icon && <span className="text-lg">{category.icon}</span>}
                      <span className="font-semibold text-sm text-gray-800">{category.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.foodItems.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          openAddItem(category.id)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Food Items */}
                  <AnimatePresence>
                    {isExpanded && category.foodItems.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t">
                          {category.foodItems.map((item) => (
                            <div
                              key={item.id}
                              className={cn(
                                'px-4 py-3 flex items-center justify-between border-b last:border-b-0',
                                !item.isAvailable && 'bg-gray-50 opacity-60'
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-medium text-sm truncate">{item.name}</span>
                                  {item.isPopular && (
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px] border-0 px-1.5 py-0">
                                      <Flame className="h-2.5 w-2.5 mr-0.5" />
                                      Populárne
                                    </Badge>
                                  )}
                                  {!item.isAvailable && (
                                    <Badge className="bg-gray-200 text-gray-500 hover:bg-gray-200 text-[10px] border-0 px-1.5 py-0">
                                      Skryté
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-sm font-semibold text-emerald-600">
                                    {formatPrice(item.price)}
                                  </span>
                                  {item.discountPrice && (
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatPrice(item.price)}
                                    </span>
                                  )}
                                  {item.discountPrice && (
                                    <span className="text-sm font-semibold text-red-500">
                                      {formatPrice(item.discountPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 ml-2">
                                {/* Toggle availability */}
                                <button
                                  onClick={() => toggleItemAvailability(item)}
                                  disabled={togglingId === item.id}
                                  className={cn(
                                    'p-1.5 rounded-lg transition-colors',
                                    item.isAvailable
                                      ? 'text-emerald-600 hover:bg-emerald-50'
                                      : 'text-gray-400 hover:bg-gray-100'
                                  )}
                                >
                                  {togglingId === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : item.isAvailable ? (
                                    <Eye className="h-4 w-4" />
                                  ) : (
                                    <EyeOff className="h-4 w-4" />
                                  )}
                                </button>

                                {/* Edit */}
                                <button
                                  onClick={() => openEditItem(item)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>

                                {/* Delete */}
                                <button
                                  onClick={() => setDeleteItemId(item.id)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                    {isExpanded && category.foodItems.length === 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t px-4 py-6 text-center">
                          <p className="text-xs text-gray-400">Žiadne položky v tejto kategórii</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-emerald-600 text-xs mt-1"
                            onClick={() => openAddItem(category.id)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Pridať položku
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pridať položku</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="item-name">Názov *</Label>
              <Input
                id="item-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Názov položky"
              />
            </div>
            <div>
              <Label htmlFor="item-desc">Popis</Label>
              <Textarea
                id="item-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Popis položky"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="item-price">Cena (€) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="item-discount">Zľavnená cena (€)</Label>
                <Input
                  id="item-discount"
                  type="number"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="item-category">Kategória *</Label>
              <select
                id="item-category"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Vyberte kategóriu</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="item-available">Dostupné</Label>
              <Switch
                id="item-available"
                checked={form.isAvailable}
                onCheckedChange={(v) => setForm({ ...form, isAvailable: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="item-popular">Populárne</Label>
              <Switch
                id="item-popular"
                checked={form.isPopular}
                onCheckedChange={(v) => setForm({ ...form, isPopular: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddItem(false)} className="border-primary/40 text-primary hover:bg-primary/5">
              Zrušiť
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveItem}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Pridať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItem} onOpenChange={setShowEditItem}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upraviť položku</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Názov *</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Názov položky"
              />
            </div>
            <div>
              <Label htmlFor="edit-desc">Popis</Label>
              <Textarea
                id="edit-desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Popis položky"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="edit-price">Cena (€) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="edit-discount">Zľavnená cena (€)</Label>
                <Input
                  id="edit-discount"
                  type="number"
                  step="0.01"
                  value={form.discountPrice}
                  onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-category">Kategória *</Label>
              <select
                id="edit-category"
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Vyberte kategóriu</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-available">Dostupné</Label>
              <Switch
                id="edit-available"
                checked={form.isAvailable}
                onCheckedChange={(v) => setForm({ ...form, isAvailable: v })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="edit-popular">Populárne</Label>
              <Switch
                id="edit-popular"
                checked={form.isPopular}
                onCheckedChange={(v) => setForm({ ...form, isPopular: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditItem(false); setEditId(null); }} className="border-primary/40 text-primary hover:bg-primary/5">
              Zrušiť
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleSaveItem}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Uložiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Pridať kategóriu</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="cat-name">Názov kategórie</Label>
            <Input
              id="cat-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Názov kategórie"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCategory(false)} className="border-primary/40 text-primary hover:bg-primary/5">
              Zrušiť
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleAddCategory}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
              Pridať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItemId} onOpenChange={() => setDeleteItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Odstrániť položku?</AlertDialogTitle>
            <AlertDialogDescription>
              Táto akcia je nevratná. Položka bude natrvalo odstránená z menu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušiť</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDeleteItem}
              disabled={saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Trash2 className="h-4 w-4 mr-1.5" />}
              Odstrániť
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VendorBottomNav />
    </div>
  )
}
