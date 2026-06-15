'use client'

import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { formatCurrency } from '@/lib/utils/index'
import type { BOQItem } from '@/types/database'

function VarianceRow({ item }: { item: BOQItem }) {
  const usedQty = item.quantity > 0 ? (item.used_total / item.unit_rate) : 0
  const variance = item.budgeted_total - item.used_total
  const variancePct = item.budgeted_total > 0 ? Math.round((variance / item.budgeted_total) * 100) : 0
  const underBudget = variance >= 0

  return (
    <div className="grid gap-3 px-4 py-3 border-b text-xs" style={{ borderColor: '#EEEEEE', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
      <p className="font-medium truncate" style={{ color: '#111111' }}>{item.description}</p>
      <p style={{ color: '#666666' }}>{item.quantity} {item.unit}</p>
      <p style={{ color: '#666666' }}>{usedQty.toFixed(1)} {item.unit}</p>
      <p style={{ color: '#666666' }}>{formatCurrency(item.budgeted_total)}</p>
      <p style={{ color: '#666666' }}>{formatCurrency(item.used_total)}</p>
      <p className="font-semibold" style={{ color: underBudget ? '#00236F' : '#E24B4A' }}>
        {underBudget ? '+' : ''}{formatCurrency(variance)}
      </p>
      <p className="font-semibold" style={{ color: underBudget ? '#00236F' : '#E24B4A' }}>
        {underBudget ? '+' : ''}{variancePct}%
      </p>
    </div>
  )
}

export default function QSVariancePage() {
  const { project } = useActiveProject()
  const { sections, loading } = useBOQSections(project?.id)

  if (loading) {
    return <div className="animate-pulse px-4 py-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
    </div>
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Budget Variance</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>{project?.name}</p>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
        <div className="grid gap-3 px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: '#EEEEEE', color: '#BBBBBB', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }}>
          <span>Item</span><span>Budgeted Qty</span><span>Used Qty</span><span>Budget RWF</span><span>Used RWF</span><span>Variance</span><span>Var %</span>
        </div>
        {sections.map((section) => (
          <div key={section.id}>
            <div className="px-4 py-2 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00236F' }}>{section.title}</p>
            </div>
            {section.items.map((item) => <VarianceRow key={item.id} item={item} />)}
          </div>
        ))}
      </div>
    </div>
  )
}
