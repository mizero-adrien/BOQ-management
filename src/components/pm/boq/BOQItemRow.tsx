'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { BOQItem } from '@/types/database'
import type { BOQItemUpdate } from '@/hooks/usePMBOQ'

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

const FS = { backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#111111' }

export default function BOQItemRow({ item, onSave, onDelete }: Props) {
  const [editing, setEditing]     = useState(false)
  const [showDel, setShowDel]     = useState(false)
  const [desc, setDesc]           = useState(item.description)
  const [unit, setUnit]           = useState(item.unit)
  const [qty, setQty]             = useState(String(item.quantity))
  const [rate, setRate]           = useState(String(item.unit_rate))
  const [saving, setSaving]       = useState(false)

  const computedBudget = (Number(qty) || 0) * (Number(rate) || 0)
  const pct = item.budgeted_total > 0 ? (item.used_total / item.budgeted_total) * 100 : 0
  const st = STATUS_MAP[item.status] ?? STATUS_MAP.not_started

  async function handleSave() {
    setSaving(true)
    await onSave(item.id, { description: desc, unit, quantity: Number(qty), unit_rate: Number(rate) })
    setSaving(false)
    setEditing(false)
  }

  function cancel() {
    setDesc(item.description); setUnit(item.unit)
    setQty(String(item.quantity)); setRate(String(item.unit_rate))
    setEditing(false)
  }

  if (showDel) {
    return (
      <tr style={{ backgroundColor: '#FFF5F5' }}>
        <td colSpan={10} className="px-4 py-3">
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: '#E24B4A' }}>Delete this line item?</span>
            <button type="button" onClick={() => onDelete(item.id)}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg" style={{ backgroundColor: '#E24B4A' }}>
              Delete
            </button>
            <button type="button" onClick={() => setShowDel(false)} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  if (editing) {
    return (
      <tr className="border-b" style={{ borderColor: '#EEEEEE', backgroundColor: '#F5F6FA' }}>
        <td className="px-3 py-2"><input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full px-2 py-1 text-sm rounded outline-none" style={FS} /></td>
        <td className="px-2 py-2"><input value={unit} onChange={(e) => setUnit(e.target.value)} className="px-2 py-1 text-sm rounded outline-none" style={{ ...FS, width: '60px' }} /></td>
        <td className="px-2 py-2"><input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="px-2 py-1 text-sm rounded outline-none" style={{ ...FS, width: '72px' }} /></td>
        <td className="px-2 py-2"><input type="number" value={rate} onChange={(e) => setRate(e.target.value)} className="px-2 py-1 text-sm rounded outline-none" style={{ ...FS, width: '96px' }} /></td>
        <td className="px-3 py-2 text-sm font-medium whitespace-nowrap" style={{ color: '#00236F' }}>{formatCurrency(computedBudget)}</td>
        <td colSpan={5} className="px-3 py-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-50" style={{ backgroundColor: '#00236F' }}>
              {saving ? '...' : 'Save'}
            </button>
            <button type="button" onClick={cancel} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
          </div>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b group" style={{ borderColor: '#EEEEEE' }}>
      <td className="px-3 py-2.5 text-sm" style={{ color: '#111111' }}>{item.description}</td>
      <td className="px-2 py-2.5 text-xs text-center" style={{ color: '#666666' }}>{item.unit}</td>
      <td className="px-2 py-2.5 text-sm text-right tabular-nums" style={{ color: '#111111' }}>{item.quantity}</td>
      <td className="px-2 py-2.5 text-sm text-right tabular-nums whitespace-nowrap" style={{ color: '#111111' }}>{formatCurrency(item.unit_rate)}</td>
      <td className="px-3 py-2.5 text-sm font-medium text-right tabular-nums whitespace-nowrap" style={{ color: '#111111' }}>{formatCurrency(item.budgeted_total)}</td>
      <td className="px-2 py-2.5 text-xs text-right tabular-nums" style={{ color: '#666666' }}>{item.used_quantity}</td>
      <td className="px-2 py-2.5 text-xs text-right tabular-nums whitespace-nowrap" style={{ color: '#666666' }}>{formatCurrency(item.used_total)}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <div className="rounded-full overflow-hidden flex-shrink-0" style={{ height: '3px', width: '44px', backgroundColor: '#EEEEEE' }}>
            <div style={{ width: `${Math.min(100, pct)}%`, backgroundColor: barColor(pct), height: '100%' }} />
          </div>
          <span className="text-xs tabular-nums" style={{ color: barColor(pct) }}>{pct.toFixed(0)}%</span>
        </div>
      </td>
      <td className="px-2 py-2.5">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ backgroundColor: st.bg, color: st.color, border: st.border ?? 'none' }}>
          {st.label}
        </span>
      </td>
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => setEditing(true)}
            className="px-2 py-1 text-xs rounded" style={{ color: '#00236F', border: '1px solid #EEEEEE' }}>Edit</button>
          <button type="button" onClick={() => setShowDel(true)}
            className="px-2 py-1 text-xs rounded" style={{ color: '#E24B4A', border: '1px solid #EEEEEE' }}>Del</button>
        </div>
      </td>
    </tr>
  )
}
