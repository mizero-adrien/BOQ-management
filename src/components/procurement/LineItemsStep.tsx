'use client'

import { useState } from 'react'
import type { NewRequestItem } from '@/hooks/usePurchaseRequests'

interface Props {
  items: NewRequestItem[]
  onChange: (items: NewRequestItem[]) => void
  onBack: () => void
  onSubmit: () => void
  saving: boolean
}

const F: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '14px', borderRadius: '8px',
  border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA', color: '#111111', outline: 'none',
}

const EMPTY: NewRequestItem = { description: '', unit: '', quantityRequested: 1, estimatedUnitPrice: undefined }

export default function LineItemsStep({ items, onChange, onBack, onSubmit, saving }: Props) {
  const [draft, setDraft] = useState<NewRequestItem>(EMPTY)

  function setField<K extends keyof NewRequestItem>(k: K, v: NewRequestItem[K]) {
    setDraft((prev) => ({ ...prev, [k]: v }))
  }

  function addItem() {
    if (!draft.description.trim() || !draft.unit.trim() || draft.quantityRequested <= 0) return
    onChange([...items, { ...draft }])
    setDraft(EMPTY)
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <div className="bg-white rounded-2xl p-5 mb-4" style={{ border: '1px solid #EEEEEE' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: '#111111', marginBottom: '16px' }}>Add item</p>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666666', marginBottom: '4px' }}>
            Description <span style={{ color: '#E24B4A' }}>*</span>
          </label>
          <input value={draft.description} onChange={(e) => setField('description', e.target.value)}
            placeholder="e.g. Portland cement 50kg bags" style={F} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666666', marginBottom: '4px' }}>
              Unit <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input value={draft.unit} onChange={(e) => setField('unit', e.target.value)}
              placeholder="bags" style={F} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666666', marginBottom: '4px' }}>
              Qty <span style={{ color: '#E24B4A' }}>*</span>
            </label>
            <input type="number" min={1} value={draft.quantityRequested}
              onChange={(e) => setField('quantityRequested', parseFloat(e.target.value) || 1)} style={F} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#666666', marginBottom: '4px' }}>
              Est. price (RWF)
            </label>
            <input type="number" min={0} value={draft.estimatedUnitPrice ?? ''}
              onChange={(e) => setField('estimatedUnitPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0" style={F} />
          </div>
        </div>
        <button
          type="button"
          onClick={addItem}
          disabled={!draft.description.trim() || !draft.unit.trim()}
          style={{ width: '100%', padding: '10px', backgroundColor: '#E4E9FA', color: '#00236F',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          className="disabled:opacity-40"
        >
          Add item
        </button>
      </div>

      {items.length > 0 && (
        <div className="bg-white rounded-2xl overflow-hidden mb-4" style={{ border: '1px solid #EEEEEE' }}>
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: idx < items.length - 1 ? '1px solid #EEEEEE' : undefined }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: '#111111' }}>{item.description}</p>
                <p style={{ fontSize: '12px', color: '#666666' }}>
                  {item.quantityRequested} {item.unit}
                  {item.estimatedUnitPrice ? ` · Est. ${item.estimatedUnitPrice.toLocaleString()} RWF` : ''}
                </p>
              </div>
              <button type="button" onClick={() => removeItem(idx)}
                style={{ color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="button" onClick={onBack}
          style={{ flex: 1, padding: '14px', backgroundColor: '#FFFFFF', color: '#666666',
            border: '1px solid #EEEEEE', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || items.length === 0}
          style={{ flex: 2, padding: '14px', backgroundColor: saving ? '#BBBBBB' : '#00236F', color: '#FFFFFF',
            border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600',
            cursor: saving || items.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'Saving...' : 'Save as draft'}
        </button>
      </div>
    </div>
  )
}
