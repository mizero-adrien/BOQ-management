'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useActiveProject } from '@/hooks/useActiveProject'
import { useBOQSections } from '@/hooks/useBOQSections'
import { createClient } from '@/lib/supabase/client'
import type { BOQItemView } from '@/types/database'

export default function StockInPage() {
  const router = useRouter()
  const { project } = useActiveProject()
  const { sections } = useBOQSections(project?.id)

  const allItems: BOQItemView[] = sections.flatMap((s) => s.items)

  const [itemId, setItemId] = useState('')
  const [qty, setQty] = useState('')
  const [supplier, setSupplier] = useState('')
  const [deliveryNote, setDeliveryNote] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (allItems.length > 0 && !itemId) setItemId(allItems[0].id)
  }, [allItems, itemId])

  const selectedItem = allItems.find((i) => i.id === itemId)
  const FIELD = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!project || !selectedItem || !qty) return
    setSubmitting(true); setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Session expired.'); setSubmitting(false); return }

    const { data: proj } = await supabase.from('projects').select('pm_id').eq('id', project.id).single()
    if (proj) {
      const body = `${qty} ${selectedItem.unit} of ${selectedItem.description} received.` +
        (supplier ? ` Supplier: ${supplier}.` : '') +
        (deliveryNote ? ` Delivery note: ${deliveryNote}.` : '') +
        (notes ? ` Notes: ${notes}.` : '')

      await supabase.from('notifications').insert({
        user_id: proj.pm_id as string,
        project_id: project.id,
        type: 'comment_added',
        title: 'Stock received at site store',
        body,
        read: false,
        action_url: '/pm/dashboard',
      })
    }

    router.push('/storekeeper/dashboard')
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '560px', margin: '0 auto' }}>
      <h1 className="text-xl font-semibold mb-1" style={{ color: '#111111' }}>Record Stock In</h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>{project?.name}</p>
      {error && <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>BOQ Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD}>
            {allItems.map((i) => <option key={i.id} value={i.id}>{i.description}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>
            Quantity received {selectedItem ? `(${selectedItem.unit})` : ''}
          </label>
          <input type="number" min="0" step="any" value={qty} onChange={(e) => setQty(e.target.value)} required className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Supplier name (optional)</label>
          <input type="text" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Delivery note number (optional)</label>
          <input type="text" value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg outline-none" style={FIELD} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#111111' }}>Notes (optional)</label>
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-4 py-3 text-sm rounded-lg outline-none resize-none" style={FIELD} />
        </div>
        <button type="submit" disabled={submitting || !project} className="w-full py-4 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: '#00236F' }}>
          {submitting ? 'Recording...' : 'Record receipt'}
        </button>
      </form>
    </div>
  )
}
