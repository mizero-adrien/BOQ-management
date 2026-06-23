'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { BOQItem } from '@/types/database'
import type { BOQItemUpdate } from '@/hooks/usePMBOQ'
import Spinner from '@/components/shared/Spinner'

const STATUS_MAP: Record<string, { label: string; bg: string; color: string; border?: string }> = {
  not_started: { label: 'Not started', bg: '#F5F6FA', color: '#BBBBBB' },
  in_progress:  { label: 'In progress',  bg: 'transparent', color: '#00236F', border: '1px solid #00236F' },
  done:         { label: 'Done',         bg: '#111111', color: '#FFFFFF' },
  over_budget:  { label: 'Over budget',  bg: '#E24B4A', color: '#FFFFFF' },
}

function barColor(pct: number): string {
  if (pct > 90) return '#E24B4A'
  if (pct > 80) return '#778EDE'
  return '#00236F'
}

interface Props {
  item: BOQItem
  onSave: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

const FS = { backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }

export default function BOQItemCard({ item, onSave, onDelete }: Props) {
  const [editing, setEditing]   = useState(false)
  const [showDel, setShowDel]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [desc, setDesc]         = useState(item.description)
  const [unit, setUnit]         = useState(item.unit)
  const [qty, setQty]           = useState(String(item.quantity))
  const [rate, setRate]         = useState(String(item.unit_rate))
  const [saving, setSaving]     = useState(false)

  const pct = item.budgeted_total > 0 ? (item.used_total / item.budgeted_total) * 100 : 0
  const st = STATUS_MAP[item.status] ?? STATUS_MAP.not_started

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, { description: desc, unit, quantity: Number(qty), unit_rate: Number(rate) })
    setSaving(false)
    setEditing(false)
  }

  if (showDel) {
    return (
      <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: '#FFF5F5', border: '1px solid #E24B4A' }}>
        <p className="text-sm mb-2" style={{ color: '#E24B4A' }}>Delete this line item?</p>
        <div className="flex gap-2">
          <button type="button" disabled={deleting}
            onClick={async () => { setDeleting(true); await onDelete(item.id); setDeleting(false) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
            style={{ backgroundColor: '#E24B4A' }}>
            {deleting && <Spinner size={12} />}
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button type="button" onClick={() => setShowDel(false)} disabled={deleting} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
        </div>
      </div>
    )
  }

  if (editing) {
    const computed = (Number(qty) || 0) * (Number(rate) || 0)
    return (
      <div className="rounded-lg p-3 mb-2" style={{ border: '1.5px solid #00236F', backgroundColor: '#F5F6FA' }}>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="col-span-2">
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description"
              className="w-full px-2 py-1.5 text-sm rounded outline-none" style={FS} autoFocus />
          </div>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Unit"
            className="px-2 py-1.5 text-sm rounded outline-none" style={FS} />
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty"
            className="px-2 py-1.5 text-sm rounded outline-none" style={FS} />
          <input type="number" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Unit rate"
            className="px-2 py-1.5 text-sm rounded outline-none" style={FS} />
          <div className="flex items-center">
            <span className="text-sm font-semibold" style={{ color: '#00236F' }}>{formatCurrency(computed)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50"
            style={{ backgroundColor: '#00236F' }}>
            {saving && <Spinner size={12} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg p-3 mb-2" style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE' }}>
      <p className="text-sm font-medium mb-1" style={{ color: '#111111' }}>{item.description}</p>
      <p className="text-xs mb-0.5" style={{ color: '#666666' }}>
        {item.quantity} {item.unit} at {formatCurrency(item.unit_rate)} = {formatCurrency(item.budgeted_total)}
      </p>
      <p className="text-xs mb-2" style={{ color: '#BBBBBB' }}>
        Used: {item.used_quantity} {item.unit} = {formatCurrency(item.used_total)}
      </p>
      <div className="rounded-full overflow-hidden mb-2" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
        <div style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor(pct), height: '100%' }} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ backgroundColor: st.bg, color: st.color, border: st.border ?? 'none' }}>
          {st.label}
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium" style={{ color: '#00236F' }}>Edit</button>
          <button type="button" onClick={() => setShowDel(true)} className="text-xs font-medium" style={{ color: '#E24B4A' }}>Delete</button>
        </div>
      </div>
    </div>
  )
}
