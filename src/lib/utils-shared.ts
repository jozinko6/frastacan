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
  pending:    { label: 'Objednávka prijatá',        color: 'text-yellow-700', bgColor: 'bg-yellow-100',  icon: '⏳' },
  confirmed:  { label: 'Potvrdené',                 color: 'text-blue-700',   bgColor: 'bg-blue-100',    icon: '✅' },
  preparing:  { label: 'Pripravuje sa',             color: 'text-primary', bgColor: 'bg-primary/10',  icon: '👨‍🍳' },
  ready:      { label: 'Pripravené na vyzdvihnutie', color: 'text-indigo-700', bgColor: 'bg-indigo-100',  icon: '📦' },
  delivering: { label: 'Kuriér je na ceste',        color: 'text-purple-700', bgColor: 'bg-purple-100',  icon: '🛵' },
  delivered:  { label: 'Doručené',                  color: 'text-green-700',  bgColor: 'bg-green-100',   icon: '✓' },
  cancelled:  { label: 'Zrušené',                   color: 'text-red-700',    bgColor: 'bg-red-100',     icon: '✗' },
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
  { name: 'Pizza', emoji: '🍕' },
  { name: 'Reštaurácie', emoji: '🍽️' },
  { name: 'Káva', emoji: '☕' },
  { name: 'Potraviny', emoji: '🛒' },
  { name: 'Kvety', emoji: '💐' },
  { name: 'Darčeky', emoji: '🎁' },
  { name: 'Street food', emoji: '🌮' },
  { name: 'Pekárne', emoji: '🥐' },
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
