// Shared utilities used across multiple views

/**
 * Authenticated fetch helper - adds Authorization header with Bearer token
 * from Zustand store. Falls back to cookie-only auth if token not available.
 */
export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // Try to get the token from the store
  // We import lazily to avoid circular deps
  let token: string | null = null
  try {
    // Access the store directly (not via hook, since this is not a React component)
    const { useAppStore } = require('@/lib/store')
    token = useAppStore.getState().authToken
  } catch {
    // Store not available, cookie auth will be used
  }

  const headers = new Headers(options.headers || {})
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  // Ensure Content-Type is set for POST/PATCH with body
  if (options.body && !headers.has('Content-Type') && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin', // Always include cookies as fallback
  })
}

export function formatPrice(price: number): string {
  return price.toFixed(2).replace('.', ',') + ' €'
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sk-SK', {
    day: 'numeric',
    month: 'short',
  })
}

export const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  pending:     { label: 'Objednávka prijatá',        color: 'text-yellow-700', bgColor: 'bg-yellow-100',  icon: '⏳' },
  confirmed:   { label: 'Potvrdené',                 color: 'text-blue-700',   bgColor: 'bg-blue-100',    icon: '✅' },
  preparing:   { label: 'Pripravuje sa',             color: 'text-primary',    bgColor: 'bg-primary/10',  icon: '👨‍🍳' },
  ready:       { label: 'Pripravené na vyzdvihnutie', color: 'text-indigo-700', bgColor: 'bg-indigo-100',  icon: '📦' },
  picking_up:  { label: 'Kuriér ide po objednávku',  color: 'text-orange-700', bgColor: 'bg-orange-100',  icon: '🛵' },
  delivering:  { label: 'Kuriér doručuje',           color: 'text-purple-700', bgColor: 'bg-purple-100',  icon: '🚗' },
  delivered:   { label: 'Doručené',                  color: 'text-green-700',  bgColor: 'bg-green-100',   icon: '✓' },
  cancelled:   { label: 'Zrušené',                   color: 'text-red-700',    bgColor: 'bg-red-100',     icon: '✗' },
  refunded:    { label: 'Vrátené',                   color: 'text-teal-700',   bgColor: 'bg-teal-100',    icon: '💰' },
  failed:      { label: 'Zlyhalo',                   color: 'text-gray-700',   bgColor: 'bg-gray-200',    icon: '⚠' },
}

export const nextStatuses: Record<string, string[]> = {
  pending:    ['confirmed', 'cancelled'],
  confirmed:  ['preparing', 'cancelled'],
  preparing:  ['ready', 'cancelled'],
  ready:      ['picking_up', 'cancelled'],
  picking_up: ['delivering', 'cancelled'],
  delivering: ['delivered', 'failed'],
  delivered:  ['refunded'],
  cancelled:  [],
  refunded:   [],
  failed:     ['refunded'],
}

export const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Čaká na platbu', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  paid:    { label: 'Zaplatené',      color: 'text-green-700',  bgColor: 'bg-green-100' },
  failed:  { label: 'Platba zlyhala', color: 'text-red-700',    bgColor: 'bg-red-100' },
}

export const cuisineOptions = [
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Reštaurácie', emoji: '🍽️' },
  { name: 'Káva', emoji: '☕' },
  { name: 'Potraviny', emoji: '🛒' },
  { name: 'Kvety', emoji: '💐' },
  { name: 'Darčeky', emoji: '🎁' },
  { name: 'Street food', emoji: '🌮' },
  { name: 'Pekárne', emoji: '🥐' },
  { name: 'Burgery', emoji: '🍔' },
  { name: 'Kebab', emoji: '🥙' },
  { name: 'Drogéria', emoji: '🧴' },
  { name: 'Chovateľstvo', emoji: '🐾' },
  { name: 'Služby', emoji: '🔧' },
  { name: 'Slovenská', emoji: '🇸🇰' },
  { name: 'Talianska', emoji: '🇮🇹' },
  { name: 'Japonská', emoji: '🇯🇵' },
  { name: 'Americká', emoji: '🇺🇸' },
  { name: 'Mexická', emoji: '🇲🇽' },
]

export const deliveryZones = [
  { name: 'Hlohovec', fee: 1.90, minOrder: 6.00, estimatedMin: 25, estimatedMax: 45 },
  { name: 'Šulekovo', fee: 2.40, minOrder: 8.00, estimatedMin: 30, estimatedMax: 50 },
  { name: 'Leopoldov', fee: 2.90, minOrder: 10.00, estimatedMin: 35, estimatedMax: 60 },
  { name: 'Červeník', fee: 3.50, minOrder: 12.00, estimatedMin: 40, estimatedMax: 70 },
]
