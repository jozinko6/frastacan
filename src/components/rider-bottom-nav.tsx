'use client'

import { LayoutDashboard, Package, Wallet, User } from 'lucide-react'
import { useAppStore, type View } from '@/lib/store'
import { cn } from '@/lib/utils'

const navItems: { view: View; icon: typeof LayoutDashboard; label: string }[] = [
  { view: 'rider-dashboard', icon: LayoutDashboard, label: 'Domov' },
  { view: 'rider-orders', icon: Package, label: 'Objednávky' },
  { view: 'rider-earnings', icon: Wallet, label: 'Zárobky' },
  { view: 'rider-profile', icon: User, label: 'Profil' },
]

export default function RiderBottomNav() {
  const { currentView, setView } = useAppStore()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-[0_-2px_10px_rgba(0,0,0,0.06)] safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = currentView === item.view
          const Icon = item.icon
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors relative',
                isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-b-full" />
              )}
              <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
              <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
