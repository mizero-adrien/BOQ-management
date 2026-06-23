function progressColor(pct: number): string {
  if (pct >= 100) return '#E24B4A'
  if (pct >= 80)  return '#EF9F27'
  return '#5DCAA5'
}

export { progressColor }

export default function BudgetProgressBar({
  used,
  total,
  height = 6,
}: {
  used: number
  total: number
  height?: number
}) {
  const pct = total > 0 ? Math.min((used / total) * 100, 100) : 0

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: `${height}px`, backgroundColor: '#EEEEEE' }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${pct}%`, backgroundColor: progressColor(pct) }}
      />
    </div>
  )
}
