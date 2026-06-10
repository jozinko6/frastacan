import { create } from 'zustand'

// Types
export interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: string
  avatar?: string
}

export interface DeliveryZone {
  id: string
  name: string
  baseFee: number
  minimumOrder: number
  estimatedMin: number
  estimatedMax: number
}

export interface Restaurant {
  id: string
  name: string
  slug: string
  description: string
  image: string
  logo?: string
  address: string
  city?: string
  phone?: string
  cuisine: string
  rating: number
  reviewCount: number
  deliveryTime: string
  minimumOrder: number
  deliveryFee: number
  isActive: boolean
  isAvailable: boolean
  zoneId?: string
  zone?: DeliveryZone
  categories?: Category[]
  reviews?: Review[]
}

export interface Category {
  id: string
  name: string
  icon?: string
  sortOrder: number
  foodItems: FoodItem[]
}

export interface FoodItem {
  id: string
  name: string
  description?: string
  image?: string
  price: number
  discountPrice?: number
  isAvailable: boolean
  isPopular: boolean
  categoryId: string
  restaurantId: string
}

export interface CartItem {
  foodItem: FoodItem
  quantity: number
  notes?: string
}

export interface Order {
  id: string
  orderNumber: string
  status: string
  paymentMethod: string
  paymentStatus: string
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  notes?: string
  deliveryAddress: string
  createdAt: string
  confirmedAt?: string
  preparedAt?: string
  deliveredAt?: string
  cancelledAt?: string
  restaurant?: { id: string; name: string; image: string; logo?: string }
  items?: { id: string; quantity: number; price: number; foodItem?: { id: string; name: string; image?: string } }[]
  review?: Review
}

export interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  customer?: { id: string; name: string }
}

export type View =
  | 'home'
  | 'restaurant'
  | 'cart'
  | 'checkout'
  | 'orders'
  | 'order-detail'
  | 'login'
  | 'register'
  | 'profile'
  | 'admin-dashboard'
  | 'admin-restaurants'
  | 'admin-orders'
  | 'admin-users'
  | 'admin-coupons'
  | 'admin-zones'
  | 'admin-categories'
  | 'rider-dashboard'
  | 'rider-orders'
  | 'rider-earnings'
  | 'rider-profile'
  | 'vendor-dashboard'
  | 'vendor-orders'
  | 'vendor-menu'
  | 'vendor-settings'
  | 'pre-prevadzky'
  | 'pre-kurierov'
  | 'terms'
  | 'privacy'
  | 'contact'
  | 'complaints'

// Store
interface AppState {
  // Auth
  user: User | null
  authToken: string | null
  setUser: (user: User | null) => void
  setAuthToken: (token: string | null) => void
  logout: () => void

  // Navigation
  currentView: View
  setView: (view: View) => void

  // Restaurant
  selectedRestaurantId: string | null
  setSelectedRestaurant: (id: string | null) => void

  // Cart
  cart: CartItem[]
  cartRestaurantId: string | null
  cartRestaurantName: string | null
  addToCart: (item: FoodItem, restaurantId: string, restaurantName: string) => void
  removeFromCart: (foodItemId: string) => void
  updateQuantity: (foodItemId: string, quantity: number) => void
  clearCart: () => void

  // Order
  selectedOrderId: string | null
  setSelectedOrder: (id: string | null) => void

  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Toast
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  clearToast: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  authToken: null,
  setUser: (user) => set({ user }),
  setAuthToken: (token) => set({ authToken: token }),
  logout: () => set({ user: null, authToken: null }),

  // Navigation
  currentView: 'home',
  setView: (view) => {
    set({ currentView: view })
    window.scrollTo(0, 0)
  },

  // Restaurant
  selectedRestaurantId: null,
  setSelectedRestaurant: (id) => set({ selectedRestaurantId: id }),

  // Cart
  cart: [],
  cartRestaurantId: null,
  cartRestaurantName: null,
  addToCart: (item, restaurantId, restaurantName) => {
    const { cart, cartRestaurantId } = get()
    // If adding from a different restaurant, clear cart
    if (cartRestaurantId && cartRestaurantId !== restaurantId && cart.length > 0) {
      set({
        cart: [{ foodItem: item, quantity: 1 }],
        cartRestaurantId: restaurantId,
        cartRestaurantName: restaurantName,
      })
      get().showToast('Košík bol vyčistený - pridali ste jedlo z inej reštaurácie', 'info')
      return
    }
    const existing = cart.find((c) => c.foodItem.id === item.id)
    if (existing) {
      set({
        cart: cart.map((c) =>
          c.foodItem.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        ),
      })
    } else {
      set({
        cart: [...cart, { foodItem: item, quantity: 1 }],
        cartRestaurantId: restaurantId,
        cartRestaurantName: restaurantName,
      })
    }
    get().showToast(`${item.name} pridané do košíka`, 'success')
  },
  removeFromCart: (foodItemId) => {
    const { cart } = get()
    const newCart = cart.filter((c) => c.foodItem.id !== foodItemId)
    set({
      cart: newCart,
      cartRestaurantId: newCart.length > 0 ? get().cartRestaurantId : null,
      cartRestaurantName: newCart.length > 0 ? get().cartRestaurantName : null,
    })
  },
  updateQuantity: (foodItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(foodItemId)
      return
    }
    const { cart } = get()
    set({
      cart: cart.map((c) =>
        c.foodItem.id === foodItemId ? { ...c, quantity } : c
      ),
    })
  },
  clearCart: () => set({ cart: [], cartRestaurantId: null, cartRestaurantName: null }),

  // Order
  selectedOrderId: null,
  setSelectedOrder: (id) => set({ selectedOrderId: id }),

  // Search
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // Toast
  toastMessage: null,
  toastType: 'success',
  showToast: (message, type = 'success') => {
    set({ toastMessage: message, toastType: type })
    setTimeout(() => get().clearToast(), 3000)
  },
  clearToast: () => set({ toastMessage: null }),
}))
