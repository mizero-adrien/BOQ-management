export function formatCurrency(amount: number, currency = 'RWF'): string {
  return new Intl.NumberFormat('rw-RW', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + currency
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-RW', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString('en-RW', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0
  return Math.round((used / total) * 100)
}

export function generateShareToken(): string {
  return crypto.randomUUID()
}

export function getBudgetStatus(usedPct: number): 'safe' | 'warning' | 'danger' {
  if (usedPct >= 100) return 'danger'
  if (usedPct >= 80) return 'warning'
  return 'safe'
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hr ago`
  if (diffDays === 1) return 'Yesterday'
  return `${diffDays} days ago`
}
