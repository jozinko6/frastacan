// Shared utilities used across multiple views

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
  pending:    { label: 'Čakajúca',      color: 'text-yellow-700', bgColor: 'bg-yellow-100',  icon: '⏳' },
  confirmed:  { label: 'Potvrdená',     color: 'text-blue-700',   bgColor: 'bg-blue-100',    icon: '✅' },
  preparing:  { label: 'Pripravuje sa', color: 'text-orange-700', bgColor: 'bg-orange-100',  icon: '👨‍🍳' },
  ready:      { label: 'Pripravená',    color: 'text-indigo-700', bgColor: 'bg-indigo-100',  icon: '📦' },
  delivering: { label: 'Na ceste',      color: 'text-purple-700', bgColor: 'bg-purple-100',  icon: '🛵' },
  delivered:  { label: 'Doručená',      color: 'text-green-700',  bgColor: 'bg-green-100',   icon: '✓' },
  cancelled:  { label: 'Zrušená',       color: 'text-red-700',    bgColor: 'bg-red-100',     icon: '✗' },
}

export const nextStatuses: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'cancelled'],
  delivering: ['delivered'],
}

export const paymentStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: 'Čaká na platbu', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  paid:    { label: 'Zaplatené',      color: 'text-green-700',  bgColor: 'bg-green-100' },
  failed:  { label: 'Platba zlyhala', color: 'text-red-700',    bgColor: 'bg-red-100' },
}

export const cuisineOptions = [
  { name: 'Slovenská', emoji: '🇸🇰' },
  { name: 'Talianska', emoji: '🇮🇹' },
  { name: 'Japonská', emoji: '🇯🇵' },
  { name: 'Americká', emoji: '🇺🇸' },
  { name: 'Mexická', emoji: '🇲🇽' },
]
