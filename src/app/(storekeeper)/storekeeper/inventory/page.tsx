'use client'

import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import type { BOQItemView } from '@/types/database'

function statusBadge(item: BOQItemView) {
  const pct = item.quantity > 0 ? item.used_quantity / item.quantity : 0
  if (pct >= 1) return { label: 'Depleted', bg: '#E24B4A', color: '#FFFFFF', border: false }
  if (pct >= 0.8) return { label: 'Low', bg: 'transparent', color: '#E24B4A', border: true, borderColor: '#E24B4A' }
  if (pct > 0) return { label: 'On track', bg: 'transparent', color: '#00236F', border: true, borderColor: '#00236F' }
  return { label: 'Not started', bg: '#F5F6FA', color: '#BBBBBB', border: false }
}

function InventoryRow({ item, isLast }: { item: BOQItemView; isLast: boolean }) {
  const remainingQty = Math.max(0, item.quantity - item.used_quantity)
  const s = statusBadge(item)

  return (
    <div className={`grid gap-2 px-4 py-3 text-xs ${isLast ? '' : 'border-b'}`}
      style={{ borderColor: '#EEEEEE', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
      <p className="font-medium truncate" style={{ color: '#111111' }}>{item.description}</p>
      <p style={{ color: '#666666' }}>{item.unit}</p>
      <p style={{ color: '#666666' }}>{item.quantity.toFixed(1)}</p>
      <p style={{ color: '#666666' }}>{item.used_quantity.toFixed(1)}</p>
      <p style={{ color: '#00236F', fontWeight: 500 }}>{remainingQty.toFixed(1)}</p>
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: s.bg, color: s.color, border: s.border ? `1px solid ${(s as { borderColor: string }).borderColor}` : undefined }}>
        {s.label}
      </span>
    </div>
  )
}

export default function InventoryPage() {
  const { project } = useActiveProject()
  const { sections, loading } = useBOQSections(project?.id)

  if (loading) {
    return (
      <div className="animate-pulse px-4 py-5 space-y-3">
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
      </div>
    )
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Inventory</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>{project?.name}</p>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
        <div className="grid gap-2 px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: '#EEEEEE', color: '#BBBBBB', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
          <span>Item</span><span>Unit</span><span>Budget Qty</span><span>Used Qty</span><span>Remaining</span><span>Status</span>
        </div>
        {sections.map((section) => (
          <div key={section.id}>
            <div className="px-4 py-2 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#00236F' }}>{section.title}</p>
            </div>
            {section.items.map((item, idx) => (
              <InventoryRow key={item.id} item={item} isLast={idx === section.items.length - 1} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
