'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, User, MapPin, Phone, Mail, LogOut, Plus, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'

interface Address {
  id: string
  label: string
  street: string
  city: string
  postalCode?: string
  isDefault: boolean
}

export default function ProfileView() {
  const { user, setUser, setView } = useAppStore()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddAddress, setShowAddAddress] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newStreet, setNewStreet] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newPostalCode, setNewPostalCode] = useState('')
  const [addingAddress, setAddingAddress] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAddresses()
    }
  }, [user])

  async function fetchAddresses() {
    try {
      setLoading(true)
      const res = await fetch(`/api/addresses?userId=${user!.id}`)
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses)
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  async function addAddress() {
    if (!newLabel || !newStreet || !newCity) {
      toast.error('Vyplňte povinné polia')
      return
    }
    try {
      setAddingAddress(true)
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel,
          street: newStreet,
          city: newCity,
          postalCode: newPostalCode,
          isDefault: addresses.length === 0,
        }),
      })
      if (res.ok) {
        toast.success('Adresa pridaná')
        setShowAddAddress(false)
        setNewLabel('')
        setNewStreet('')
        setNewCity('')
        setNewPostalCode('')
        fetchAddresses()
      }
    } catch {
      toast.error('Chyba pri pridávaní adresy')
    } finally {
      setAddingAddress(false)
    }
  }

  function handleLogout() {
    setUser(null)
    setView('home')
    toast.info('Boli ste odhlásení')
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-2xl font-bold mb-2">Prihláste sa</h2>
        <p className="text-muted-foreground mb-6">
          Pre zobrazenie profilu sa musíte prihlásiť
        </p>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setView('login')}>
          Prihlásiť sa
        </Button>
      </div>
    )
  }

  return (
    <div className="view-transition max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setView('home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Môj profil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* User Info */}
        <div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <User className="h-10 w-10 text-orange-500" />
              </div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {user.phone && (
                <p className="text-muted-foreground text-sm mt-1">{user.phone}</p>
              )}
              <Badge className="mt-3 bg-orange-100 text-orange-700 border-0">
                {user.role === 'admin' ? 'Administrátor' : user.role === 'restaurant' ? 'Reštaurácia' : 'Zákazník'}
              </Badge>

              <Separator className="my-4" />

              <div className="space-y-2 text-left text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{user.phone}</span>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Odhlásiť sa
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Addresses */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-500" />
                  Moje adresy
                </CardTitle>
                <Dialog open={showAddAddress} onOpenChange={setShowAddAddress}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus className="h-4 w-4 mr-1" />
                      Pridať
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nová adresa</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Označenie *</Label>
                        <Input
                          placeholder="napr. Domov, Práca"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Ulica a číslo *</Label>
                        <Input
                          placeholder="napr. Hlavná 25"
                          value={newStreet}
                          onChange={(e) => setNewStreet(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mesto *</Label>
                        <Input
                          placeholder="napr. Košice"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>PSČ</Label>
                        <Input
                          placeholder="napr. 040 01"
                          value={newPostalCode}
                          onChange={(e) => setNewPostalCode(e.target.value)}
                        />
                      </div>
                      <Button
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={addAddress}
                        disabled={addingAddress}
                      >
                        Uložiť adresu
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Zatiaľ nemáte uložené žiadne adresy</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-white"
                    >
                      <MapPin className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.label}</span>
                          {addr.isDefault && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                              Predvolená
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {addr.street}, {addr.city}
                          {addr.postalCode && `, ${addr.postalCode}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card
              className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setView('orders')}
            >
              <CardContent className="p-4 text-center">
                <span className="text-2xl">📦</span>
                <p className="font-medium text-sm mt-1">Moje objednávky</p>
              </CardContent>
            </Card>
            {user.role === 'admin' && (
              <Card
                className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setView('admin-dashboard')}
              >
                <CardContent className="p-4 text-center">
                  <span className="text-2xl">⚙️</span>
                  <p className="font-medium text-sm mt-1">Administrácia</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
