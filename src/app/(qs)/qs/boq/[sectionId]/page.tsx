'use client'

import { use, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils/index'
import type { BOQItem, BOQSection } from '@/types/database'

export default function QSSectionDetailPage({ params }: { params: Promise<{ sectionId: string }> }) {
  const { sectionId } = use(params)
  const [section, setSection] = useState<BOQSection | null>(null)
  const [items, setItems] = useState<BOQItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    Promise.all([
      supabase.from('boq_sections').select('*').eq('id', sectionId).single(),
      supabase.from('boq_items').select('*').eq('section_id', sectionId).order('order_index', { ascending: true }),
    ]).then(([{ data: sec }, { data: its }]) => {
      setSection(sec)
      setItems((its ?? []) as BOQItem[])
      setLoading(false)
    })
  }, [sectionId])

  if (loading) {
    return <div className="animate-pulse px-4 py-5 space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl" style={{ backgroundColor: '#EEEEEE' }} />)}
    </div>
  }

  const totalBudget = items.reduce((s, i) => s + Number(i.budgeted_total), 0)
  const totalUsed = items.reduce((s, i) => s + Number(i.used_total), 0)
  const pct = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0
  const color = pct > 90 ? '#E24B4A' : pct > 70 ? '#778EDE' : '#00236F'

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>{section?.title ?? 'Section'}</h1>
      <p className="text-sm mb-2" style={{ color: '#666666' }}>{formatCurrency(totalUsed)} of {formatCurrency(totalBudget)} used</p>
      <div className="rounded-full overflow-hidden mb-5" style={{ height: '6px', backgroundColor: '#EEEEEE' }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }} />
      </div>

      <div className="bg-white rounded-xl overflow-hidden" style={{ border: '0.5px solid #EEEEEE' }}>
        <div className="grid px-4 py-2 border-b text-xs font-semibold uppercase tracking-wider"
          style={{ borderColor: '#EEEEEE', color: '#BBBBBB', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
          <span>Description</span><span>Unit</span><span>Qty</span><span>Rate</span><span>Budget</span><span>Used</span>
        </div>
        {items.map((item, idx) => (
          <div key={item.id} className={`grid px-4 py-3 text-xs ${idx < items.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: '#EEEEEE', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}>
            <p className="font-medium" style={{ color: '#111111' }}>{item.description}</p>
            <p style={{ color: '#666666' }}>{item.unit}</p>
            <p style={{ color: '#666666' }}>{item.quantity}</p>
            <p style={{ color: '#666666' }}>{formatCurrency(item.unit_rate)}</p>
            <p style={{ color: '#666666' }}>{formatCurrency(item.budgeted_total)}</p>
            <p className="font-semibold" style={{ color }}>{formatCurrency(item.used_total)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
