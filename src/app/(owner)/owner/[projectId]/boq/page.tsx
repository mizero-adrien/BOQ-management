'use client'

import { use } from 'react'
import { useOwnerBOQSummary } from '@/hooks/useOwnerBOQSummary'
import { formatCurrency } from '@/lib/utils/index'

function progressColor(pct: number) {
  if (pct > 90) return '#E24B4A'
  if (pct > 70) return '#778EDE'
  return '#00236F'
}

export default function OwnerBOQPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { sections, loading } = useOwnerBOQSummary(projectId)

  const totalBudget = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-3">
        {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Bill of Quantities</h1>
      <p className="text-sm mb-1" style={{ color: '#666666' }}>
        {formatCurrency(totalUsed)} spent of {formatCurrency(totalBudget)}
      </p>
      <p className="text-xs mb-5" style={{ color: '#BBBBBB' }}>
        Showing budget summary. Detailed line items are managed by your project team.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-xl font-bold" style={{ color: '#111111' }}>{formatCurrency(totalBudget)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Total budget</p>
        </div>
        <div className="bg-white rounded-xl p-4" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="text-xl font-bold" style={{ color: '#00236F' }}>{formatCurrency(totalUsed)}</p>
          <p className="text-xs mt-0.5" style={{ color: '#666666' }}>Total spent</p>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.section_id} className="bg-white rounded-xl mb-3 overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold" style={{ color: '#111111' }}>{section.section_title}</p>
              <p className="text-xs font-semibold" style={{ color: progressColor(Number(section.usage_pct)) }}>
                {Number(section.usage_pct).toFixed(1)}%
              </p>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
              <div className="h-full rounded-full" style={{
                width: `${Math.min(100, Number(section.usage_pct))}%`,
                backgroundColor: progressColor(Number(section.usage_pct))
              }} />
            </div>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p style={{ color: '#666666' }}>Budgeted</p>
              <p className="font-semibold mt-0.5" style={{ color: '#111111' }}>{formatCurrency(section.total_budgeted)}</p>
            </div>
            <div>
              <p style={{ color: '#666666' }}>Spent</p>
              <p className="font-semibold mt-0.5" style={{ color: '#00236F' }}>{formatCurrency(section.total_used)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
