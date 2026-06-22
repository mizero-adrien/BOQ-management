'use client'

import { useState } from 'react'
import type { ParsedBOQSection } from '@/lib/boq/parseExcel'
import { formatCurrency } from '@/lib/utils'

type ProgressCallback = (done: number, total: number) => void

interface Props {
  sections: ParsedBOQSection[]
  onImport: (sections: ParsedBOQSection[], onProgress: ProgressCallback) => Promise<void>
  onBack: () => void
}

export default function ImportPreview({ sections: initial, onImport, onBack }: Props) {
  const [sections, setSections] = useState<ParsedBOQSection[]>(initial)
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true })
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  function renameSection(idx: number, title: string) {
    setSections((prev) => prev.map((s, i) => i === idx ? { ...s, title } : s))
  }

  function removeSection(idx: number) {
    setSections((prev) => prev.filter((_, i) => i !== idx))
  }

  function removeItem(sectionIdx: number, itemIdx: number) {
    setSections((prev) => prev.map((s, i) =>
      i === sectionIdx ? { ...s, items: s.items.filter((_, j) => j !== itemIdx) } : s
    ))
  }

  const totalItems = sections.reduce((n, s) => n + s.items.length, 0)
  const validSections = sections.filter((s) => s.items.length > 0)

  async function handleImport() {
    setImporting(true)
    setProgress({ done: 0, total: validSections.length })
    await onImport(validSections, (done, total) => setProgress({ done, total }))
    setImporting(false)
    setProgress(null)
  }

  if (sections.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm" style={{ color: '#666666' }}>All sections removed. Go back to select a different file.</p>
        <button type="button" onClick={onBack} className="mt-4 text-sm font-medium" style={{ color: '#00236F' }}>Go back</button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: '#666666' }}>
          {validSections.length} section{validSections.length !== 1 ? 's' : ''}, {totalItems} item{totalItems !== 1 ? 's' : ''} detected
        </p>
        <button type="button" onClick={onBack} className="text-xs" style={{ color: '#BBBBBB' }}>Change file</button>
      </div>

      <div className="flex flex-col gap-2 mb-5" style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {sections.map((sec, si) => (
          <div key={si} className="rounded-xl" style={{ border: '1px solid #EEEEEE', backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button type="button" onClick={() => setExpanded((e) => ({ ...e, [si]: !e[si] }))}
                className="p-0.5" style={{ color: '#BBBBBB' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: expanded[si] ? 'rotate(90deg)' : 'none', transition: 'transform 0.1s' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <input value={sec.title} onChange={(e) => renameSection(si, e.target.value)}
                className="flex-1 text-sm font-semibold px-1 py-0.5 rounded outline-none"
                style={{ color: '#111111', backgroundColor: 'transparent' }}
                onFocus={(e) => (e.target.style.backgroundColor = '#F5F6FA')}
                onBlur={(e) => (e.target.style.backgroundColor = 'transparent')} />
              <span className="text-xs flex-shrink-0" style={{ color: '#BBBBBB' }}>{sec.items.length} items</span>
              <button type="button" onClick={() => removeSection(si)} className="text-xs flex-shrink-0" style={{ color: '#E24B4A' }}>Remove</button>
            </div>
            {expanded[si] && (
              <div className="border-t overflow-x-auto" style={{ borderColor: '#EEEEEE' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: '#F5F6FA' }}>
                      {['Description', 'Unit', 'Qty', 'Unit Rate', 'Budgeted', ''].map((h, i) => (
                        <th key={i} className="px-3 py-1.5 text-left" style={{ fontSize: '10px', color: '#BBBBBB', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map((item, ii) => (
                      <tr key={ii} className="border-t" style={{ borderColor: '#EEEEEE' }}>
                        <td className="px-3 py-1.5 text-xs" style={{ color: '#111111', maxWidth: '220px' }}>{item.description}</td>
                        <td className="px-2 py-1.5 text-xs" style={{ color: '#666666' }}>{item.unit}</td>
                        <td className="px-2 py-1.5 text-xs tabular-nums text-right" style={{ color: '#666666' }}>{item.quantity}</td>
                        <td className="px-2 py-1.5 text-xs tabular-nums text-right whitespace-nowrap" style={{ color: '#666666' }}>{formatCurrency(item.unit_rate)}</td>
                        <td className="px-3 py-1.5 text-xs tabular-nums text-right whitespace-nowrap font-medium" style={{ color: '#00236F' }}>
                          {formatCurrency(item.quantity * item.unit_rate)}
                        </td>
                        <td className="px-2 py-1.5">
                          <button type="button" onClick={() => removeItem(si, ii)} className="text-xs" style={{ color: '#E24B4A' }}>Del</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {importing && progress && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs" style={{ color: '#666666' }}>
              Importing section {progress.done} of {progress.total}…
            </span>
            <span className="text-xs font-semibold" style={{ color: '#00236F' }}>
              {progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0}%
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`, backgroundColor: '#00236F' }}
            />
          </div>
        </div>
      )}

      <button type="button" onClick={handleImport} disabled={importing || validSections.length === 0}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: '#00236F' }}>
        {importing && (
          <span className="inline-block w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
            style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF' }} />
        )}
        {importing
          ? 'Importing…'
          : `Import ${validSections.length} section${validSections.length !== 1 ? 's' : ''} (${totalItems} items)`}
      </button>
    </div>
  )
}
