'use client'

import { use } from 'react'
import { useBOQSections } from '@/hooks/useBOQSections'
import { formatCurrency } from '@/lib/utils/index'

function progressColor(pct: number) {
  if (pct > 90) return '#E24B4A'
  if (pct > 70) return '#778EDE'
  return '#00236F'
}

export default function OwnerBOQPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { sections, loading } = useBOQSections(projectId)

  const totalBudget = sections.reduce((s, sec) => s + sec.total_budgeted, 0)
  const totalUsed = sections.reduce((s, sec) => s + sec.total_used, 0)

  if (loading) {
    return <div className="animate-pulse px-4 py-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
    </div>
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Bill of Quantities</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>Read only — {formatCurrency(totalUsed)} spent of {formatCurrency(totalBudget)}</p>
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-xl mb-4 overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-sm font-semibold" style={{ color: '#111111' }}>{section.title}</p>
              <p className="text-xs font-semibold" style={{ color: progressColor(section.usage_pct) }}>{section.usage_pct}%</p>
            </div>
            <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, section.usage_pct)}%`, backgroundColor: progressColor(section.usage_pct) }} />
            </div>
          </div>
          {section.items.map((item, idx) => (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 text-xs ${idx < section.items.length - 1 ? 'border-b' : ''}`} style={{ borderColor: '#EEEEEE' }}>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate" style={{ color: '#111111' }}>{item.description}</p>
                <p className="mt-0.5" style={{ color: '#666666' }}>{item.quantity} {item.unit} × {formatCurrency(item.unit_rate)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold" style={{ color: '#00236F' }}>{formatCurrency(item.used_total)}</p>
                <p style={{ color: '#BBBBBB' }}>/ {formatCurrency(item.budgeted_total)}</p>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
