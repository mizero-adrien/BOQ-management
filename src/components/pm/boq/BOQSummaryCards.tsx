'use client'

import { formatCurrency } from '@/lib/utils'
import type { BOQSummary } from '@/hooks/usePMBOQ'

function barColor(pct: number): string {
  if (pct > 90) return '#E24B4A'
  if (pct > 80) return '#778EDE'
  return '#00236F'
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
      {children}
      <p className="text-xs mt-1.5" style={{ color: '#666666' }}>{label}</p>
    </div>
  )
}

export default function BOQSummaryCards({ summary }: { summary: BOQSummary }) {
  const { total_budgeted, total_used, total_remaining, usage_pct } = summary
  const spentColor = usage_pct >= 80 ? '#E24B4A' : '#00236F'
  const remainColor = total_remaining < 0 ? '#E24B4A' : '#111111'
  const color = barColor(usage_pct)

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <Card label="Total budget">
        <p className="text-xl font-semibold" style={{ color: '#111111' }}>{formatCurrency(total_budgeted)}</p>
      </Card>
      <Card label="Amount spent">
        <p className="text-xl font-semibold" style={{ color: spentColor }}>{formatCurrency(total_used)}</p>
      </Card>
      <Card label="Remaining">
        <p className="text-xl font-semibold" style={{ color: remainColor }}>{formatCurrency(total_remaining)}</p>
      </Card>
      <Card label="Overall budget usage">
        <p className="text-xl font-semibold mb-2" style={{ color }}>{usage_pct.toFixed(1)}%</p>
        <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, usage_pct)}%`, backgroundColor: color }} />
        </div>
      </Card>
    </div>
  )
}
