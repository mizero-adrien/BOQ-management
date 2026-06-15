'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { useProjectMembers } from '@/hooks/useProjectMembers'
import { createClient } from '@/lib/supabase/client'
import type { BOQItem } from '@/types/database'

export default function StockOutPage() {
  const router = useRouter()
  const { project } = useActiveProject()
  const { sections } = useBOQSections(project?.id)
  const { members } = useProjectMembers(project?.id)

  const allItems: BOQItem[] = sections.flatMap((s) => s.items)
  const engineers = members.filter((m) => ['engineer', 'foreman'].includes(m.role))

  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState(1)
  const [engineerId, setEngineerId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (allItems.length > 0 && !itemId) setItemId(allItems[0].id)
  }, [allItems, itemId])

  useEffect(() => {
    if (engineers.length > 0 && !engineerId) setEngineerId(engineers[0].userId)
  }, [engineers, engineerId])

  const selectedItem = allItems.find((i) => i.id === itemId)
  const selectedEngineer = engineers.find((e) => e.userId === engineerId)
  const FIELD = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !selectedItem) return
    setSubmitting(true); setError(null)

    const supabase = createClient()
    const costRwf = qty * Number(selectedItem.unit_rate)
    const notesStr = `Issued to ${selectedEngineer?.fullName ?? 'Unknown'}${notes ? ` — ${notes}` : ''}`

    const { error: err } = await supabase.from('material_logs').insert({
      report_id: null,
      boq_item_id: selectedItem.id,
      quantity_used: qty,
      cost_rwf: costRwf,
    })

    if (err) { setError('Failed to record issuance.'); setSubmitting(false); return }
    router.push('/storekeeper/dashboard')
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Record Stock Out</h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>{project?.name}</p>
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>BOQ Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD}>
            {allItems.map((i) => <option key={i.id} value={i.id}>{i.description} ({i.unit})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#111111' }}>
            Quantity {selectedItem ? `(${selectedItem.unit})` : ''}
          </label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}>−</button>
            <span className="text-2xl font-bold w-12 text-center" style={{ color: '#00236F' }}>{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-semibold"
              style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }}>+</button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Issued to</label>
          <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)} required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD}>
            {engineers.map((e) => <option key={e.userId} value={e.userId}>{e.fullName}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Notes (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none" style={FIELD} />
        </div>
        <button type="submit" disabled={submitting || !project} className="w-full py-4 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#00236F' }}>
          {submitting ? 'Recording...' : 'Record issuance'}
        </button>
      </form>
    </div>
  )
}
