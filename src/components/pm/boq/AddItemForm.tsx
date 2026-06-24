'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { NewBOQItem } from '@/hooks/usePMBOQ'
import Spinner from '@/components/shared/Spinner'
import AIPriceSuggester from './AIPriceSuggester'

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
  const [aiOpen, setAiOpen] = useState(false)

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
    <>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="number" placeholder="0" value={unitRate} onChange={(e) => setUnitRate(e.target.value)}
              className="px-2 py-1.5 text-sm rounded outline-none" style={{ ...FS, width: '96px' }}
            />
            {description.trim().length >= 3 && !aiOpen && (
              <button type="button" onClick={() => setAiOpen(true)}
                style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 7px', backgroundColor: '#E4E9FA', color: '#00236F', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                AI price
              </button>
            )}
          </div>
        </td>
        <td className="px-3 py-2">
          <span className="text-sm font-medium whitespace-nowrap" style={{ color: '#00236F' }}>{formatCurrency(budgeted)}</span>
        </td>
        <td colSpan={5} className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button" onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
              style={{ backgroundColor: '#00236F' }}
            >
              {saving && <Spinner size={12} />}
              {saving ? 'Saving…' : 'Save item'}
            </button>
            <button type="button" onClick={onCancel} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
          </div>
        </td>
      </tr>
      {aiOpen && (
        <tr style={{ backgroundColor: '#EAF0FF' }}>
          <td colSpan={10} style={{ padding: '0 12px 12px' }}>
            <AIPriceSuggester
              itemDescription={description}
              autoFetch={true}
              onAccept={(rate) => { setUnitRate(String(rate)); setAiOpen(false) }}
              onClose={() => setAiOpen(false)}
            />
          </td>
        </tr>
      )}
    </>
  )
}
