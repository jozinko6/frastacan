'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ShoppingCart,
  User,
  Package,
  Home,
  UtensilsCrossed,
  LogIn,
  LayoutDashboard,
  Menu,
  Bike,
  Tag,
  MapPin,
  Grid3X3,
  Users,
  ArrowLeft,
  Store,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAppStore, View } from '@/lib/store'
import { toast } from 'sonner'

// Views
import HomeView from '@/components/home-view'
import RestaurantView from '@/components/restaurant-view'
import CartView from '@/components/cart-view'
import CheckoutView from '@/components/checkout-view'
import OrdersView from '@/components/orders-view'
import OrderDetailView from '@/components/order-detail-view'
import LoginView from '@/components/login-view'
import RegisterView from '@/components/register-view'
import ProfileView from '@/components/profile-view'
import AdminDashboardView from '@/components/admin-dashboard-view'
import AdminRestaurantsView from '@/components/admin-restaurants-view'
import AdminOrdersView from '@/components/admin-orders-view'
import AdminUsersView from '@/components/admin-users-view'
import AdminCouponsView from '@/components/admin-coupons-view'
import AdminZonesView from '@/components/admin-zones-view'
import AdminCategoriesView from '@/components/admin-categories-view'
import AdminSidebar, { adminNavItems } from '@/components/admin-sidebar'
import RiderDashboardView from '@/components/rider-dashboard-view'
import RiderOrdersView from '@/components/rider-orders-view'
import RiderEarningsView from '@/components/rider-earnings-view'
import RiderProfileView from '@/components/rider-profile-view'
import VendorDashboardView from '@/components/vendor-dashboard-view'
import VendorOrdersView from '@/components/vendor-orders-view'
import VendorMenuView from '@/components/vendor-menu-view'
import VendorSettingsView from '@/components/vendor-settings-view'
import TermsView from '@/components/terms-view'
import PrivacyView from '@/components/privacy-view'
import ContactView from '@/components/contact-view'
import ComplaintsView from '@/components/complaints-view'
import PrePrevadzkyView from '@/components/pre-prevadzky-view'
import PreKurierovView from '@/components/pre-kurierov-view'

const adminViews: View[] = [
  'admin-dashboard',
  'admin-restaurants',
  'admin-orders',
  'admin-users',
  'admin-coupons',
  'admin-zones',
  'admin-categories',
]

const riderViews: View[] = ['rider-dashboard', 'rider-orders', 'rider-earnings', 'rider-profile']
const vendorViews: View[] = ['vendor-dashboard', 'vendor-orders', 'vendor-menu', 'vendor-settings']

function isAdminView(view: string): boolean {
  return adminViews.includes(view as View)
}

function isRiderView(view: string): boolean {
  return riderViews.includes(view as View)
}

function isVendorView(view: string): boolean {
  return vendorViews.includes(view as View)
}

function ViewRenderer() {
  const { currentView } = useAppStore()

  switch (currentView) {
    case 'home':
      return <HomeView />
    case 'restaurant':
      return <RestaurantView />
    case 'cart':
      return <CartView />
    case 'checkout':
      return <CheckoutView />
    case 'orders':
      return <OrdersView />
    case 'order-detail':
      return <OrderDetailView />
    case 'login':
      return <LoginView />
    case 'register':
      return <RegisterView />
    case 'profile':
      return <ProfileView />
    case 'admin-dashboard':
      return <AdminDashboardView />
    case 'admin-restaurants':
      return <AdminRestaurantsView />
    case 'admin-orders':
      return <AdminOrdersView />
    case 'admin-users':
      return <AdminUsersView />
    case 'admin-coupons':
      return <AdminCouponsView />
    case 'admin-zones':
      return <AdminZonesView />
    case 'admin-categories':
      return <AdminCategoriesView />
    case 'rider-dashboard':
      return <RiderDashboardView />
    case 'rider-orders':
      return <RiderOrdersView />
    case 'rider-earnings':
      return <RiderEarningsView />
    case 'rider-profile':
      return <RiderProfileView />
    case 'vendor-dashboard':
      return <VendorDashboardView />
    case 'vendor-orders':
      return <VendorOrdersView />
    case 'vendor-menu':
      return <VendorMenuView />
    case 'vendor-settings':
      return <VendorSettingsView />
    case 'terms':
      return <TermsView />
    case 'privacy':
      return <PrivacyView />
    case 'contact':
      return <ContactView />
    case 'complaints':
      return <ComplaintsView />
    case 'pre-prevadzky':
      return <PrePrevadzkyView />
    case 'pre-kurierov':
      return <PreKurierovView />
    default:
      return <HomeView />
  }
}

// Mobile admin bottom navigation
function MobileAdminNav() {
  const { currentView, setView } = useAppStore()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-md safe-area-bottom">
      <div className="flex items-stretch justify-around overflow-x-auto scrollbar-hide">
        {adminNavItems.map((item) => {
          const isActive = currentView === item.view
          return (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-2 transition-colors shrink-0 min-w-[58px] ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
              <span className={`text-[10px] leading-tight whitespace-nowrap ${isActive ? 'font-semibold text-primary' : ''}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function Header() {
  const { user, cart, currentView, setView, setUser, setAuthToken } = useAppStore()
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const inAdmin = isAdminView(currentView)

  // Check for existing session on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        // Try to get user from cookie-based auth
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' })
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            // Store the fresh token for authFetch to use
            if (data.token) {
              setAuthToken(data.token)
            }
          }
        }
      } catch {
        // Not logged in, that's fine
      }
    }
    checkAuth()
  }, [])

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-md safe-area-top">
      <div className={`mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 ${inAdmin ? 'max-w-full' : 'max-w-6xl'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {inAdmin ? (
            <>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setView('home')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <button
                className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
                onClick={() => setView('admin-dashboard')}
              >
                <img src="/frastacan-logo.png" alt="Fraštačan" className="h-7 w-7 rounded-lg shrink-0" />
                <span className="text-base sm:text-lg font-bold text-primary truncate">Admin</span>
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-opacity min-w-0"
              onClick={() => setView('home')}
            >
              <img src="/frastacan-logo.png" alt="Fraštačan" className="h-8 w-8 rounded-lg shrink-0" />
              <span className="text-lg sm:text-xl font-bold text-primary hidden xs:inline sm:inline truncate">Fraštačan</span>
            </button>
          )}
        </div>

        {/* Desktop Navigation (non-admin) */}
        {!inAdmin && (
          <nav className="hidden md:flex items-center gap-1">
            <Button
              variant={currentView === 'home' ? 'secondary' : 'ghost'}
              size="sm"
              className={currentView === 'home' ? 'bg-primary/10 text-primary' : ''}
              onClick={() => setView('home')}
            >
              <Home className="h-4 w-4 mr-1.5" />
              Domov
            </Button>

            {user && (
              <Button
                variant={currentView === 'orders' ? 'secondary' : 'ghost'}
                size="sm"
                className={currentView === 'orders' ? 'bg-primary/10 text-primary' : ''}
                onClick={() => setView('orders')}
              >
                <Package className="h-4 w-4 mr-1.5" />
                Objednávky
              </Button>
            )}

            {user?.role === 'admin' && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary"
                onClick={() => setView('admin-dashboard')}
              >
                <LayoutDashboard className="h-4 w-4 mr-1.5" />
                Admin
              </Button>
            )}

            {user?.role === 'rider' && (
              <Button
                variant={currentView === 'rider-dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                className={currentView === 'rider-dashboard' ? 'bg-primary/10 text-primary' : ''}
                onClick={() => setView('rider-dashboard')}
              >
                <Bike className="h-4 w-4 mr-1.5" />
                Kurier
              </Button>
            )}

            {user?.role === 'restaurant' && (
              <Button
                variant={currentView === 'vendor-dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                className={currentView === 'vendor-dashboard' ? 'bg-emerald-50 text-emerald-700' : ''}
                onClick={() => setView('vendor-dashboard')}
              >
                <Store className="h-4 w-4 mr-1.5" />
                Prevádzka
              </Button>
            )}
          </nav>
        )}

        {/* Admin desktop nav title */}
        {inAdmin && (
          <div className="hidden lg:block" />
        )}

        {/* Right Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {!inAdmin && (
            <Button
              variant={currentView === 'cart' ? 'secondary' : 'ghost'}
              size="icon"
              className={`relative h-10 w-10 shrink-0 ${currentView === 'cart' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'}`}
              onClick={() => setView('cart')}
              aria-label="Košík"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs border-2 border-background">
                  {cartCount}
                </Badge>
              )}
            </Button>
          )}

          {user ? (
            <Button
              variant={currentView === 'profile' ? 'secondary' : 'ghost'}
              size="icon"
              className={`h-10 w-10 shrink-0 ${currentView === 'profile' ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'}`}
              onClick={() => setView('profile')}
              aria-label="Profil"
            >
              <User className="h-5 w-5" />
            </Button>
          ) : (
            !inAdmin && (
              <Button
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-3 shrink-0"
                onClick={() => setView('login')}
              >
                <LogIn className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Prihlásiť</span>
              </Button>
            )
          )}

          <MobileMenu />
        </div>
      </div>
    </header>
  )
}

function MobileMenu() {
  const { user, currentView, setView, logout } = useAppStore()
  const [open, setOpen] = useState(false)
  const inAdmin = isAdminView(currentView)

  function navigate(view: Parameters<typeof setView>[0]) {
    setView(view)
    setOpen(false)
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    logout()
    setView('home')
    setOpen(false)
    toast.info('Boli ste odhlásení')
  }

  const menuItems = inAdmin
    ? [
        { view: 'admin-dashboard' as const, icon: LayoutDashboard, label: 'Prehľad' },
        { view: 'admin-orders' as const, icon: Package, label: 'Objednávky' },
        { view: 'admin-restaurants' as const, icon: UtensilsCrossed, label: 'Prevádzky' },
        { view: 'admin-users' as const, icon: Users, label: 'Zákazníci' },
        { view: 'admin-coupons' as const, icon: Tag, label: 'Kupóny' },
        { view: 'admin-zones' as const, icon: MapPin, label: 'Doručovacie zóny' },
        { view: 'admin-categories' as const, icon: Grid3X3, label: 'Kategórie' },
      ]
    : [
        { view: 'home' as const, icon: Home, label: 'Domov' },
        ...(user
          ? [
              { view: 'orders' as const, icon: Package, label: 'Objednávky' },
              { view: 'profile' as const, icon: User, label: 'Profil' },
            ]
          : []),
        ...(user?.role === 'admin'
          ? [
              { view: 'admin-dashboard' as const, icon: LayoutDashboard, label: 'Admin panel' },
            ]
          : []),
        ...(user?.role === 'rider'
          ? [
              { view: 'rider-dashboard' as const, icon: Bike, label: 'Kurier panel' },
            ]
          : []),
        ...(user?.role === 'restaurant'
          ? [
              { view: 'vendor-dashboard' as const, icon: Store, label: 'Prevádzka panel' },
            ]
          : []),
      ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10 shrink-0 hover:bg-muted/60" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72 sm:w-80 safe-area-top">
        <div className="flex items-center gap-2 mb-6 mt-2">
          <img src="/frastacan-logo.png" alt="Fraštačan" className="h-8 w-8 rounded-lg shrink-0" />
          <span className="text-xl font-bold text-primary">Fraštačan</span>
        </div>

        {user && (
          <div className="p-3 rounded-lg bg-primary/5 mb-4">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Button
              key={item.view}
              variant={currentView === item.view ? 'secondary' : 'ghost'}
              className={`w-full justify-start h-11 ${
                currentView === item.view ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60'
              }`}
              onClick={() => navigate(item.view)}
            >
              <item.icon className="h-4 w-4 mr-2 shrink-0" />
              {item.label}
            </Button>
          ))}

          {inAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:bg-muted/60 h-11"
              onClick={() => navigate('home')}
            >
              <ArrowLeft className="h-4 w-4 mr-2 shrink-0" />
              Späť na stránku
            </Button>
          )}

          <div className="pt-4 border-t mt-4">
            {user ? (
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 h-11"
                onClick={handleLogout}
              >
                <LogIn className="h-4 w-4 mr-2 rotate-180 shrink-0" />
                Odhlásiť sa
              </Button>
            ) : (
              !inAdmin && (
                <>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11"
                    onClick={() => navigate('login')}
                  >
                    Prihlásiť sa
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-primary/40 text-primary hover:bg-primary/5 h-11"
                    onClick={() => navigate('register')}
                  >
                    Zaregistrovať sa
                  </Button>
                </>
              )
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}

function Footer() {
  const { setView } = useAppStore()

  return (
    <footer className="border-t bg-gray-100 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 safe-area-x">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src="/frastacan-logo.png" alt="Fraštačan" className="h-8 w-8 rounded-lg" />
              <span className="text-lg sm:text-xl font-bold text-primary">Fraštačan</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Lokálne doručenie pre Hlohovec, Šulekovo, Leopoldov a Červeník. Jedlo, káva, kvety aj nákup z okolia.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-900">Navigácia</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('home')}>
                  Prevádzky
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('orders')}>
                  Moje objednávky
                </button>
              </li>
              <li>
                <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('profile')}>
                  Profil
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-3 text-gray-900">Kontakt</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>
                <button className="hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('contact')}>
                  Kontaktujte nás
                </button>
              </li>
              <li>info@frastacan.sk</li>
              <li>Hlohovec a okolie</li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <h4 className="font-semibold mb-3 text-gray-900">Otváracie hodiny</h4>
            <ul className="space-y-2.5 text-sm text-gray-600">
              <li>Po - Pi: 10:00 - 22:00</li>
              <li>So: 11:00 - 23:00</li>
              <li>Ne: 11:00 - 21:00</li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Fraštačan. Všetky práva vyhradené.
          </p>
          <div className="flex items-center gap-3 sm:gap-4 text-sm flex-wrap justify-center sm:justify-end">
            <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('terms')}>
              Obchodné podmienky
            </button>
            <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('privacy')}>
              Ochrana súkromia
            </button>
            <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('contact')}>
              Kontakt
            </button>
            <button className="text-gray-600 hover:text-primary transition-colors min-h-[28px]" onClick={() => setView('complaints')}>
              Reklamačný poriadok
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function MainPage() {
  const currentView = useAppStore((s) => s.currentView)
  const inAdmin = isAdminView(currentView)
  const inRider = isRiderView(currentView)
  const inVendor = isVendorView(currentView)
  const showRegularLayout = !inAdmin && !inRider && !inVendor

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {inAdmin ? (
              <div className="flex max-w-full">
                <AdminSidebar />
                <div className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-x-hidden">
                  <div className="max-w-5xl mx-auto">
                    <ViewRenderer />
                  </div>
                </div>
              </div>
            ) : (
              <ViewRenderer />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      {showRegularLayout && <Footer />}
      {inAdmin && <MobileAdminNav />}
    </div>
  )
}
