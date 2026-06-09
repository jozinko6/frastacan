'use client'

import { useAppStore, View } from '@/lib/store'
import {
  LayoutDashboard,
  Package,
  UtensilsCrossed,
  Users,
  Tag,
  MapPin,
  Grid3X3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const adminNavItems: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'admin-dashboard', icon: LayoutDashboard, label: 'Prehľad' },
  { view: 'admin-orders', icon: Package, label: 'Objednávky' },
  { view: 'admin-restaurants', icon: UtensilsCrossed, label: 'Prevádzky' },
  { view: 'admin-users', icon: Users, label: 'Zákazníci' },
  { view: 'admin-coupons', icon: Tag, label: 'Kupóny' },
  { view: 'admin-zones', icon: MapPin, label: 'Doručovacie zóny' },
  { view: 'admin-categories', icon: Grid3X3, label: 'Kategórie' },
]

export default function AdminSidebar() {
  const { currentView, setView } = useAppStore()

  return (
    <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r bg-gray-50/50">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Admin panel
        </h2>
        <nav className="space-y-1">
          {adminNavItems.map((item) => {
            const isActive = currentView === item.view
            return (
              <Button
                key={item.view}
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-2.5 text-sm h-9 px-3',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => setView(item.view)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export { adminNavItems }
