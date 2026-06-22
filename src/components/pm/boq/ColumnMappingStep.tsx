'use client'

import { useState } from 'react'
import type { RawHeaderCandidate, ColumnMap } from '@/lib/boq/parseExcel'

interface Props {
  candidates: RawHeaderCandidate[]
  onConfirm: (map: ColumnMap) => void
  onBack: () => void
}

const NONE = -1

export default function ColumnMappingStep({ candidates, onConfirm, onBack }: Props) {
  const [headerRowIdx, setHeaderRowIdx] = useState<number>(candidates[0]?.rowIdx ?? 0)
  const [desc, setDesc] = useState<number>(NONE)
  const [unit, setUnit] = useState<number>(NONE)
  const [qty, setQty] = useState<number>(NONE)
  const [rate, setRate] = useState<number>(NONE)

  const selectedRow = candidates.find((c) => c.rowIdx === headerRowIdx)
  const headers = selectedRow?.headers ?? []

  const rowOptions = candidates.map((c) => ({
    rowIdx: c.rowIdx,
    label: `Row ${c.rowIdx + 1}: ${c.headers.filter(Boolean).slice(0, 4).join(', ')}`,
  }))

  function ColSelect({ label, value, onChange, required }: { label: string; value: number; onChange: (v: number) => void; required?: boolean }) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: '#111111' }}>
          {label}{required && <span style={{ color: '#D42B2B' }}> *</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid #DDDDDD', color: '#111111', backgroundColor: '#FFFFFF' }}
        >
          <option value={NONE}>— not in file —</option>
          {headers.map((h, i) => (
            <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
          ))}
        </select>
      </div>
    )
  }

  const canConfirm = desc !== NONE && (qty !== NONE || rate !== NONE)

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl px-4 py-3" style={{ backgroundColor: '#FFF8E7', border: '1px solid #F5D76E' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#7A5C00' }}>Column headers not detected automatically</p>
        <p className="text-xs leading-relaxed" style={{ color: '#7A5C00' }}>
          Select which row contains your column headers, then map each column below. Description and at least one of Quantity or Unit Rate are required.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold" style={{ color: '#111111' }}>Header row</label>
        <select
          value={headerRowIdx}
          onChange={(e) => {
            setHeaderRowIdx(Number(e.target.value))
            setDesc(NONE); setUnit(NONE); setQty(NONE); setRate(NONE)
          }}
          className="rounded-lg px-3 py-2 text-sm"
          style={{ border: '1px solid #DDDDDD', color: '#111111', backgroundColor: '#FFFFFF' }}
        >
          {rowOptions.map((r) => (
            <option key={r.rowIdx} value={r.rowIdx}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ColSelect label="Description" value={desc} onChange={setDesc} required />
        <ColSelect label="Unit" value={unit} onChange={setUnit} />
        <ColSelect label="Quantity" value={qty} onChange={setQty} required={rate === NONE} />
        <ColSelect label="Unit Rate" value={rate} onChange={setRate} required={qty === NONE} />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-xl py-2.5 text-sm font-medium"
          style={{ border: '1px solid #DDDDDD', color: '#444444' }}
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => onConfirm({ headerRowIdx, desc, unit, qty, rate })}
          className="flex-1 rounded-xl py-2.5 text-sm font-semibold"
          style={{
            backgroundColor: canConfirm ? '#111111' : '#CCCCCC',
            color: '#FFFFFF',
            cursor: canConfirm ? 'pointer' : 'not-allowed',
          }}
        >
          Preview Import
        </button>
      </div>
    </div>
  )
}
