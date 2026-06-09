'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, RefreshCw, Users, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useAppStore } from '@/lib/store'
import { formatDate } from '@/lib/utils-shared'
import { toast } from 'sonner'

const roleLabels: Record<string, string> = {
  customer: 'Zákazník',
  rider: 'Kuriér',
  restaurant: 'Prevádzkovateľ',
  admin: 'Admin',
}

const roleColors: Record<string, string> = {
  customer: 'bg-blue-100 text-blue-700',
  rider: 'bg-purple-100 text-purple-700',
  restaurant: 'bg-primary/10 text-primary',
  admin: 'bg-red-100 text-red-700',
}

interface AdminUser {
  id: string
  email: string
  name: string
  phone?: string | null
  role: string
  isActive: boolean
  createdAt: string
  _count: { orders: number; restaurants: number; deliveredOrders: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AdminUsersView() {
  const { user, setView } = useAppStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 })

  const fetchUsers = useCallback(async (page?: number) => {
    try {
      setRefreshing(true)
      const params = new URLSearchParams()
      if (roleFilter && roleFilter !== 'all') params.set('role', roleFilter)
      if (searchQuery) params.set('search', searchQuery)
      if (page) params.set('page', String(page))
      const res = await fetch(`/api/admin/users?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setPagination(data.pagination)
      } else {
        toast.error('Chyba pri načítaní používateľov')
      }
    } catch {
      toast.error('Chyba pri načítaní používateľov')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [roleFilter, searchQuery])

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchUsers(1)
    }
  }, [user, roleFilter, searchQuery, fetchUsers])

  async function toggleActive(userId: string, currentActive: boolean) {
    try {
      setTogglingId(userId)
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isActive: !currentActive }),
      })
      if (res.ok) {
        const data = await res.json()
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isActive: data.user.isActive } : u))
        )
        toast.success(
          !currentActive
            ? `Aktivovaný: ${data.user.name}`
            : `Deaktivovaný: ${data.user.name}`
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
          <Users className="h-6 w-6 text-primary" />
          Správa používateľov
        </h1>
        <div className="flex-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(pagination.page)}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Obnoviť
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hľadať podľa mena alebo e-mailu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Shield className="h-4 w-4 mr-1.5" />
            <SelectValue placeholder="Filtrovať podľa roly" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Všetky roly</SelectItem>
            <SelectItem value="customer">Zákazník</SelectItem>
            <SelectItem value="rider">Kuriér</SelectItem>
            <SelectItem value="restaurant">Prevádzkovateľ</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-14 rounded-lg" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {searchQuery || roleFilter !== 'all'
                ? 'Žiadni používatelia nezodpovedajú filtrom'
                : 'Zatiaľ žiadni používatelia'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meno</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Rola</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="hidden sm:table-cell">Dátum registrácie</TableHead>
                    <TableHead className="text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Badge className={`${roleColors[u.role] || 'bg-gray-100 text-gray-700'} border-0 text-xs`}>
                          {roleLabels[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={u.isActive ? 'bg-green-100 text-green-700 border-0' : 'bg-red-100 text-red-700 border-0'}>
                          {u.isActive ? 'Aktívny' : 'Neaktívny'}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={u.isActive}
                            disabled={togglingId === u.id || u.id === user?.id}
                            onCheckedChange={() => toggleActive(u.id, u.isActive)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchUsers(pagination.page - 1)}
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
                onClick={() => fetchUsers(pagination.page + 1)}
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
