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
  const isWarning = pct >= 80 && pct < 100
  const isDanger = pct >= 100
  const barColor = isDanger || isWarning ? '#E24B4A' : '#00236F'

  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: `${height}px`, backgroundColor: '#EEEEEE' }}
    >
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${pct}%`,
          backgroundColor: barColor,
        }}
      />
    </div>
  )
}
