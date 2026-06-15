import { formatCurrency } from '@/lib/utils'

interface BOQSectionData {
  id: string
  title: string
  total_budgeted: number
  total_used: number
  items_count: number
}

function barColor(pct: number): string {
  if (pct > 90) return '#E24B4A'
  if (pct > 75) return '#778EDE'
  return '#00236F'
}

export default function ShareBOQ({ sections }: { sections: BOQSectionData[] }) {
  if (sections.length === 0) {
    return (
      <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
        <p className="text-sm font-semibold mb-3" style={{ color: '#111111' }}>Bill of Quantities</p>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No BOQ sections added yet.</p>
      </div>
    )
  }

  const totalBudgeted = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)

  return (
    <div className="bg-white rounded-xl p-5 mb-6" style={{ border: '0.5px solid #EEEEEE' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: '#111111' }}>Bill of Quantities</p>
        <p className="text-xs" style={{ color: '#666666' }}>
          {formatCurrency(totalUsed)} / {formatCurrency(totalBudgeted)}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {sections.map((sec) => {
          const pct = sec.total_budgeted > 0 ? Math.round((sec.total_used / sec.total_budgeted) * 100) : 0
          const color = barColor(pct)
          return (
            <div key={sec.id}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm" style={{ color: '#111111' }}>{sec.title}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: '#666666' }}>{sec.items_count} items</span>
                  <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct}%</span>
                </div>
              </div>
              <div className="rounded-full overflow-hidden" style={{ height: '5px', backgroundColor: '#EEEEEE' }}>
                <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: '#BBBBBB' }}>Used {formatCurrency(sec.total_used)}</span>
                <span className="text-xs" style={{ color: '#BBBBBB' }}>{formatCurrency(sec.total_budgeted)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
