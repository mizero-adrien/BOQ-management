export function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // Monday-first grid: Mon=0, Tue=1, ... Sun=6
  const startDow = (firstDay.getDay() + 6) % 7
  const endDow = (lastDay.getDay() + 6) % 7

  const days: Date[] = []

  // Previous month padding
  const prevLastDate = new Date(year, month, 0).getDate()
  for (let i = startDow - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, prevLastDate - i))
  }

  // Current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d))
  }

  // Next month padding to complete the final row
  const endPad = endDow === 6 ? 0 : 6 - endDow
  for (let d = 1; d <= endPad; d++) {
    days.push(new Date(year, month + 1, d))
  }

  return days
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function parseLocalDate(dateStr: string): Date {
  const parts = dateStr.split('-').map(Number)
  return new Date(parts[0], parts[1] - 1, parts[2])
}

export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
}

export function formatDayLabel(date: Date): string {
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'short' })
  const day = date.getDate()
  const month = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${weekday} ${day} ${month}`
}
