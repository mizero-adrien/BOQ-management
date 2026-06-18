'use client'

import { useState } from 'react'
import type { PurchaseRequestItem } from '@/hooks/usePurchaseRequests'
import type { DeliveryItem } from '@/hooks/usePurchaseOrders'

interface Props {
  orderId: string
  items: PurchaseRequestItem[]
  onRecord: (orderId: string, items: DeliveryItem[], notes?: string) => Promise<boolean>
  onClose: () => void
}

export default function DeliveryModal({ orderId, items, onRecord, onClose }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(items.map((i) => [i.id, i.quantity_requested - i.quantity_delivered]))
  )
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  function setQty(id: string, val: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, val) }))
  }

  async function handleSubmit() {
    const deliveryItems: DeliveryItem[] = items
      .filter((item) => (quantities[item.id] ?? 0) > 0)
      .map((item) => ({ requestItemId: item.id, quantityReceived: quantities[item.id] ?? 0 }))

    if (deliveryItems.length === 0) return
    setSaving(true)
    const ok = await onRecord(orderId, deliveryItems, notes || undefined)
    setSaving(false)
    if (ok) onClose()
  }

  const F: React.CSSProperties = { width: '100%', padding: '8px 12px', fontSize: '14px', borderRadius: '8px', border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', outline: 'none' }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #EEEEEE' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#EEEEEE' }}>
          <h2 className="font-semibold" style={{ color: '#111111' }}>Record delivery</h2>
          <button type="button" onClick={onClose} style={{ color: '#BBBBBB', fontSize: '20px' }}>&#x2715;</button>
        </div>
        <div className="px-5 py-4 space-y-3">
          {items.map((item) => {
            const remaining = item.quantity_requested - item.quantity_delivered
            return (
              <div key={item.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium" style={{ color: '#111111' }}>{item.description}</p>
                  <p className="text-xs" style={{ color: '#BBBBBB' }}>Rem: {remaining} {item.unit}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={remaining}
                  value={quantities[item.id] ?? 0}
                  onChange={(e) => setQty(item.id, parseFloat(e.target.value) || 0)}
                  style={F}
                />
              </div>
            )
          })}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#666666' }}>Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...F, resize: 'none' }} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #EEEEEE', color: '#666666' }}>Cancel</button>
            <button type="button" onClick={handleSubmit} disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: '#00236F' }}>
              {saving ? 'Recording...' : 'Record delivery'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
