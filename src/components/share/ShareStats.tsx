import { formatCurrency } from '@/lib/utils'

interface Props {
  totalBudgeted: number
  totalUsed: number
  totalReports: number
  workersToday: number
  openIssues: number
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
      <p className="text-xl font-bold mb-0.5" style={{ color: '#111111' }}>{value}</p>
      {sub && <p className="text-xs mb-1" style={{ color: '#666666' }}>{sub}</p>}
      <p className="text-xs" style={{ color: '#BBBBBB' }}>{label}</p>
    </div>
  )
}

export default function ShareStats({ totalBudgeted, totalUsed, totalReports, workersToday, openIssues }: Props) {
  const usedPct = totalBudgeted > 0 ? Math.round((totalUsed / totalBudgeted) * 100) : 0
  const usedColor = usedPct >= 90 ? '#E24B4A' : usedPct >= 75 ? '#778EDE' : '#00236F'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      <StatCard label="Total budget" value={formatCurrency(totalBudgeted)} />
      <StatCard
        label="Budget used"
        value={`${usedPct}%`}
        sub={formatCurrency(totalUsed)}
      />
      <StatCard label="Reports submitted" value={String(totalReports)} />
      <StatCard label="Workers on site today" value={String(workersToday)} />
      <StatCard
        label="Open issues"
        value={String(openIssues)}
      />
    </div>
  )
}
