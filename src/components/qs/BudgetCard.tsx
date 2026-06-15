import { formatCurrency } from '@/lib/utils/index'
import type { SectionWithItems } from '@/hooks/useBOQSections'

function progressColor(pct: number): string {
  if (pct > 90) return '#E24B4A'
  if (pct > 70) return '#778EDE'
  return '#00236F'
}

interface BudgetCardProps {
  projectName: string
  sections: SectionWithItems[]
}

export default function BudgetCard({ projectName, sections }: BudgetCardProps) {
  const totalBudget = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)
  const pct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0

  return (
    <div className="bg-white rounded-xl p-5 mb-4" style={{ border: '0.5px solid #EEEEEE' }}>
      <p className="text-base font-semibold mb-4" style={{ color: '#111111' }}>{projectName}</p>
      <div className="mb-3">
        <p className="font-bold" style={{ fontSize: '28px', color: '#111111', lineHeight: 1 }}>
          {formatCurrency(totalBudget)}
        </p>
        <p className="text-xs mt-1" style={{ color: '#666666' }}>Total budget</p>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="font-semibold" style={{ fontSize: '18px', color: '#00236F' }}>{formatCurrency(totalUsed)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Amount spent</p>
        </div>
        <div>
          <p className="font-semibold" style={{ fontSize: '18px', color: '#666666' }}>{formatCurrency(Math.max(0, totalBudget - totalUsed))}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Remaining</p>
        </div>
      </div>
      <div className="rounded-full overflow-hidden" style={{ height: '10px', backgroundColor: '#EEEEEE' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: progressColor(pct) }} />
      </div>
      <p className="text-xs mt-1.5 text-right" style={{ color: '#666666' }}>{pct}% used</p>
    </div>
  )
}
