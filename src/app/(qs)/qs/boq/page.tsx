'use client'

import { useState } from 'react'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { formatCurrency } from '@/lib/utils/index'
import { createClient } from '@/lib/supabase/client'
import type { BOQItemView } from '@/types/database'

function EditRow({ item, onSave }: { item: BOQItemView; onSave: (id: string, rate: number, qty: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [rate, setRate] = useState(String(item.unit_rate ?? 0))
  const [qty, setQty] = useState(String(item.quantity))

  async function save() {
    const r = Number(rate); const q = Number(qty)
    if (isNaN(r) || isNaN(q)) return
    const supabase = createClient()
    await supabase.from('boq_items').update({ unit_rate: r, quantity: q, budgeted_total: r * q } as Record<string, number>).eq('id', item.id)
    onSave(item.id, r, q)
    setEditing(false)
  }

  const FIELD = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

  return (
    <div className="px-4 py-3 border-b last:border-0" style={{ borderColor: '#EEEEEE' }}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: '#111111' }}>{item.description}</p>
          {editing ? (
            <div className="flex gap-2 mt-2">
              <div>
                <label className="text-xs" style={{ color: '#666666' }}>Qty ({item.unit})</label>
                <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}
                  className="block w-24 px-2 py-1.5 text-sm rounded-lg outline-none mt-0.5" style={FIELD} />
              </div>
              <div>
                <label className="text-xs" style={{ color: '#666666' }}>Unit rate</label>
                <input type="number" value={rate} onChange={(e) => setRate(e.target.value)}
                  className="block w-28 px-2 py-1.5 text-sm rounded-lg outline-none mt-0.5" style={FIELD} />
              </div>
            </div>
          ) : (
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
              {item.quantity} {item.unit} × {formatCurrency(item.unit_rate ?? 0)} = {formatCurrency(item.budgeted_total ?? 0)}
            </p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: '#666666' }}>Used: {formatCurrency(item.used_total ?? 0)}</p>
          {editing ? (
            <div className="flex gap-1 mt-1">
              <button type="button" onClick={save} className="text-xs px-2.5 py-1 rounded-lg text-white" style={{ backgroundColor: '#00236F' }}>Save</button>
              <button type="button" onClick={() => setEditing(false)} className="text-xs px-2.5 py-1 rounded-lg" style={{ color: '#666666', backgroundColor: '#F5F6FA' }}>Cancel</button>
            </div>
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="text-xs mt-1" style={{ color: '#00236F' }}>Edit</button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QSBOQPage() {
  const { project } = useActiveProject()
  const { sections, loading } = useBOQSections(project?.id)

  function handleSave(sectionId: string, itemId: string, rate: number, qty: number) {
    // Optimistic update handled inside EditRow; parent just logs
  }

  if (loading) {
    return <div className="animate-pulse px-4 py-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
    </div>
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Bill of Quantities</h1>
      <p className="text-sm mb-5" style={{ color: '#666666' }}>{project?.name}</p>
      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-xl mb-4 overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: '#111111' }}>{section.title}</p>
              <p className="text-xs" style={{ color: '#666666' }}>{formatCurrency(section.total_used)} / {formatCurrency(section.total_budgeted)}</p>
            </div>
          </div>
          {section.items.map((item) => (
            <EditRow key={item.id} item={item} onSave={(id, r, q) => handleSave(section.id, id, r, q)} />
          ))}
        </div>
      ))}
    </div>
  )
}
