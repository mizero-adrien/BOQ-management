'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { NewBOQItem } from '@/hooks/usePMBOQ'

interface Props {
  sectionId: string
  nextOrderIndex: number
  onSave: (sectionId: string, item: NewBOQItem) => Promise<void>
  onCancel: () => void
}

const FS = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

export default function AddItemForm({ sectionId, nextOrderIndex, onSave, onCancel }: Props) {
  const [description, setDescription] = useState('')
  const [unit, setUnit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unitRate, setUnitRate] = useState('')
  const [saving, setSaving] = useState(false)

  const qty = Number(quantity) || 0
  const rate = Number(unitRate) || 0
  const budgeted = qty * rate

  async function handleSave() {
    if (!description.trim() || !unit.trim() || qty <= 0 || rate <= 0 || saving) return
    setSaving(true)
    await onSave(sectionId, { description: description.trim(), unit: unit.trim(), quantity: qty, unit_rate: rate, order_index: nextOrderIndex })
    setSaving(false)
    onCancel()
  }

  return (
    <tr style={{ backgroundColor: '#EEF2FF' }}>
      <td className="px-3 py-2">
        <input
          placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-2 py-1.5 text-sm rounded outline-none" style={FS} autoFocus
        />
      </td>
      <td className="px-2 py-2">
        <input
          placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)}
          className="px-2 py-1.5 text-sm rounded outline-none" style={{ ...FS, width: '64px' }}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number" placeholder="0" value={quantity} onChange={(e) => setQuantity(e.target.value)}
          className="px-2 py-1.5 text-sm rounded outline-none" style={{ ...FS, width: '72px' }}
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number" placeholder="0" value={unitRate} onChange={(e) => setUnitRate(e.target.value)}
          className="px-2 py-1.5 text-sm rounded outline-none" style={{ ...FS, width: '96px' }}
        />
      </td>
      <td className="px-3 py-2">
        <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#00236F' }}>{formatCurrency(budgeted)}</span>
      </td>
      <td colSpan={5} className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button" onClick={handleSave} disabled={saving}
            className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#00236F' }}
          >
            {saving ? '...' : 'Save'}
          </button>
          <button type="button" onClick={onCancel} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
        </div>
      </td>
    </tr>
  )
}
