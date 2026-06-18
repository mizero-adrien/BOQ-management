'use client'

import type { VarianceSummary } from '@/hooks/usePriceVariance'

interface Props {
  summary: VarianceSummary
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function VarianceSummaryCards({ summary }: Props) {
  const isOver = summary.total_variance > 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
      <div className="bg-white rounded-xl px-4 py-4" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#666666' }}>Total estimated</p>
        <p className="text-xl font-bold" style={{ color: '#111111' }}>{fmt(summary.total_estimated)}</p>
        <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>RWF</p>
      </div>
      <div className="bg-white rounded-xl px-4 py-4" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#666666' }}>Total actual</p>
        <p className="text-xl font-bold" style={{ color: '#111111' }}>{fmt(summary.total_actual)}</p>
        <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>RWF</p>
      </div>
      <div className="bg-white rounded-xl px-4 py-4" style={{ border: `1px solid ${isOver ? '#E24B4A' : '#5DCAA5'}` }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#666666' }}>Variance</p>
        <p className="text-xl font-bold" style={{ color: isOver ? '#E24B4A' : '#5DCAA5' }}>
          {isOver ? '+' : ''}{fmt(summary.total_variance)}
        </p>
        <p className="text-xs mt-0.5" style={{ color: isOver ? '#E24B4A' : '#5DCAA5' }}>
          {isOver ? '+' : ''}{summary.variance_pct.toFixed(1)}%
        </p>
      </div>
      <div className="bg-white rounded-xl px-4 py-4" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-xs font-medium mb-1" style={{ color: '#666666' }}>Over budget items</p>
        <p className="text-xl font-bold" style={{ color: summary.over_budget_count > 0 ? '#E24B4A' : '#111111' }}>
          {summary.over_budget_count}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>
          {summary.under_budget_count} under budget
        </p>
      </div>
    </div>
  )
}
