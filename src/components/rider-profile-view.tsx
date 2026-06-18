'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Mail,
  Phone,
  Star,
  Bike,
  Car,
  Package,
  Wallet,
  Calendar,
  LogOut,
  Home,
  RefreshCw,
  AlertCircle,
  Shield,
  Footprints,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { formatPrice, authFetchOrLogout } from '@/lib/utils-shared'
import { toast } from 'sonner'
import RiderBottomNav from '@/components/rider-bottom-nav'

interface RiderProfile {
  id: string
  userId: string
  isAvailable: boolean
  currentLat: number | null
  currentLng: number | null
  vehicleType: string
  totalDeliveries: number
  totalEarnings: number
  walletBalance: number
  rating: number
  reviewCount: number
  createdAt: string
}

interface RiderUser {
  id: string
  name: string
  email: string
  phone: string | null
  avatar: string | null
  role: string
}

const vehicleOptions: { key: string; label: string; icon: typeof Bike }[] = [
  { key: 'bicycle', label: 'Bicykel', icon: Bike },
  { key: 'scooter', label: 'Skúter', icon: Bike },
  { key: 'car', label: 'Auto', icon: Car },
  { key: 'foot', label: 'Pešo', icon: Footprints },
]

export default function RiderProfileView() {
  const { user, setView, logout } = useAppStore()
  const [profile, setProfile] = useState<RiderProfile | null>(null)
  const [riderUser, setRiderUser] = useState<RiderUser | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const [changingVehicle, setChangingVehicle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authFetchOrLogout('/api/rider')
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Chyba pri načítaní profilu')
      }
      const data = await res.json()
      setProfile(data.profile)
      setRiderUser(data.user)
      setIsAvailable(data.profile.isAvailable)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Neznáma chyba')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  async function toggleAvailability() {
    try {
      const res = await authFetchOrLogout('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !isAvailable }),
      })
      if (res.ok) {
        setIsAvailable(!isAvailable)
        toast.success(isAvailable ? 'Som nedostupný' : 'Som dostupný')
      } else {
        toast.error('Chyba pri zmene dostupnosti')
      }
    } catch {
      toast.error('Chyba pri zmene dostupnosti')
    }
  }

  async function changeVehicleType(vehicleType: string) {
    setChangingVehicle(true)
    try {
      const res = await authFetchOrLogout('/api/rider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleType }),
      })
      if (res.ok) {
        const data = await res.json()
        setProfile(data.profile)
        const v = vehicleOptions.find((o) => o.key === vehicleType)
        toast.success(`Vozidlo zmenené na: ${v?.label || vehicleType}`)
      } else {
        toast.error('Chyba pri zmene typu vozidla')
      }
    } catch {
      toast.error('Chyba pri zmene typu vozidla')
    } finally {
      setChangingVehicle(false)
    }
  }

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    logout()
    setView('home')
    toast.info('Boli ste odhlásení')
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-[#B42318] px-4 pt-6 pb-12 rounded-b-3xl">
          <Skeleton className="h-7 w-24 bg-white/20 mb-6" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 bg-white/10 rounded-full" />
            <div>
              <Skeleton className="h-5 w-28 bg-white/10 mb-2" />
              <Skeleton className="h-4 w-36 bg-white/10" />
            </div>
          </div>
        </div>
        <div className="px-4 -mt-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
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
          <Button onClick={fetchProfile} variant="outline" className="gap-2 border-primary/40 text-primary hover:bg-primary/5">
            <RefreshCw className="h-4 w-4" />
            Skúsiť znova
          </Button>
        </motion.div>
        <RiderBottomNav />
      </div>
    )
  }

  const currentVehicle = vehicleOptions.find((o) => o.key === profile?.vehicleType) || vehicleOptions[0]
  const VehicleIcon = currentVehicle.icon
  const initials = riderUser?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'RK'

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('sk-SK', {
        month: 'long',
        year: 'numeric',
      })
    : '—'

  // Render stars
  const rating = profile?.rating ?? 0
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header with profile card */}
      <div className="bg-[#B42318] px-4 pt-6 pb-12 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <h1 className="text-white text-xl font-bold mb-6">Profil</h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/15 backdrop-blur-sm rounded-2xl p-5"
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white/30">
                <AvatarImage src={riderUser?.avatar || undefined} />
                <AvatarFallback className="bg-[#8B1B12] text-white text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-white font-bold text-lg">
                  {riderUser?.name || 'Kurier'}
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <Shield className="h-3.5 w-3.5 text-red-200" />
                  <span className="text-red-200 text-xs">Kurier Fraštačan</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        'h-3.5 w-3.5',
                        i < fullStars
                          ? 'text-yellow-400 fill-yellow-400'
                          : i === fullStars && hasHalfStar
                          ? 'text-yellow-400 fill-yellow-400/50'
                          : 'text-white/30'
                      )}
                    />
                  ))}
                  <span className="text-white text-xs ml-1">
                    {rating.toFixed(1)} ({profile?.reviewCount || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-4 space-y-1.5">
              <div className="flex items-center gap-2 text-red-200 text-xs">
                <Mail className="h-3.5 w-3.5" />
                <span>{riderUser?.email}</span>
              </div>
              {riderUser?.phone && (
                <div className="flex items-center gap-2 text-red-200 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{riderUser.phone}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 -mt-6 space-y-3">
        {/* Vehicle type selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#B42318]/10 rounded-lg">
                    <VehicleIcon className="h-5 w-5 text-[#B42318]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Vozidlo</p>
                    <p className="text-xs text-muted-foreground">{currentVehicle.label}</p>
                  </div>
                </div>
              </div>
              {/* Vehicle type selector */}
              <div className="grid grid-cols-4 gap-2">
                {vehicleOptions.map((v) => {
                  const VIcon = v.icon
                  const isActive = profile?.vehicleType === v.key
                  return (
                    <button
                      key={v.key}
                      onClick={() => changeVehicleType(v.key)}
                      disabled={changingVehicle}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-center',
                        isActive
                          ? 'border-[#B42318] bg-[#B42318]/5'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      )}
                    >
                      <VIcon className={cn('h-5 w-5', isActive ? 'text-[#B42318]' : 'text-gray-400')} />
                      <span className={cn('text-[11px] font-medium', isActive ? 'text-[#B42318]' : 'text-gray-500')}>
                        {v.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Availability toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    isAvailable ? 'bg-green-100' : 'bg-gray-100'
                  )}
                >
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      isAvailable ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    )}
                  />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {isAvailable ? 'Som dostupný' : 'Som nedostupný'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAvailable ? 'Dostávate nové doručovacie úlohy' : 'Zapnite si dostupnosť'}
                  </p>
                </div>
              </div>
              <Switch
                checked={isAvailable}
                onCheckedChange={toggleAvailability}
                className="scale-125 data-[state=checked]:bg-green-500"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-0 shadow-md">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Štatistiky</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Package className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <p className="font-bold text-lg">{profile?.totalDeliveries ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Doručení</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <Wallet className="h-5 w-5 text-green-500 mx-auto mb-1" />
                  <p className="font-bold text-lg">
                    {formatPrice(profile?.totalEarnings ?? 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Celkom zárobky</p>
                </div>
                <div className="bg-[#B42318]/5 rounded-lg p-3 text-center">
                  <Star className="h-5 w-5 text-[#B42318] mx-auto mb-1" />
                  <p className="font-bold text-lg">{rating.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Hodnotenie</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <Calendar className="h-5 w-5 text-purple-500 mx-auto mb-1" />
                  <p className="font-bold text-sm">{memberSince}</p>
                  <p className="text-xs text-muted-foreground">Člen od</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Back to home */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            className="w-full h-11 text-sm gap-2 border-primary/40 text-primary hover:bg-primary/5"
            onClick={() => setView('home')}
          >
            <Home className="h-4 w-4" />
            Späť na hlavnú stránku
          </Button>
        </motion.div>

        {/* Logout button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            variant="ghost"
            className="w-full h-11 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            <LogOut className="h-4 w-4" />
            Odhlásiť sa
          </Button>
        </motion.div>
      </div>

      <RiderBottomNav />
    </div>
  )
}
