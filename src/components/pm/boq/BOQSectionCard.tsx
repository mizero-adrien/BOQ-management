'use client'

import { useState } from 'react'
import type { PMBOQSection, NewBOQItem, BOQItemUpdate } from '@/hooks/usePMBOQ'
import { formatCurrency } from '@/lib/utils'
import BOQSectionBody from './BOQSectionBody'
import Spinner from '@/components/shared/Spinner'

interface Props {
  section: PMBOQSection
  onUpdateSection: (id: string, title: string) => Promise<void>
  onDeleteSection: (id: string) => Promise<void>
  onAddItem: (sectionId: string, item: NewBOQItem) => Promise<void>
  onUpdateItem: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

function barColor(pct: number): string {
  if (pct > 90) return '#E24B4A'
  if (pct > 80) return '#778EDE'
  return '#00236F'
}

export default function BOQSectionCard({ section, onUpdateSection, onDeleteSection, onAddItem, onUpdateItem, onDeleteItem }: Props) {
  const [expanded, setExpanded]       = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [editingTitle, setEditTitle]  = useState(false)
  const [title, setTitle]             = useState(section.title)
  const [savingTitle, setSavingTitle] = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const [deleting, setDeleting]       = useState(false)

  const color = barColor(section.usage_pct)

  async function saveTitle() {
    if (!title.trim()) return
    setSavingTitle(true)
    await onUpdateSection(section.id, title.trim())
    setSavingTitle(false)
    setEditTitle(false)
    setMenuOpen(false)
  }

  return (
    <div className="mb-2 rounded-xl" style={{ border: '1px solid #EEEEEE', overflow: 'visible' }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3.5 bg-white rounded-xl cursor-pointer"
        onClick={() => !editingTitle && setExpanded((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ flexShrink: 0, transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {editingTitle ? (
          <input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setEditTitle(false); setMenuOpen(false) } }}
            className="flex-1 px-2 py-1 text-sm font-semibold rounded outline-none"
            style={{ backgroundColor: '#F5F6FA', border: '1px solid #00236F', color: '#111111' }}
          />
        ) : (
          <span className="flex-1 font-semibold truncate" style={{ fontSize: '15px', color: '#111111' }}>{section.title}</span>
        )}

        <span className="hidden sm:inline text-xs px-2.5 py-0.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: '#F5F6FA', border: '1px solid #EEEEEE', color: '#666666' }}>
          {section.items.length} items
        </span>

        <div className="hidden md:block text-right flex-shrink-0">
          <p className="text-sm font-medium tabular-nums" style={{ color: '#111111' }}>{formatCurrency(section.total_budgeted)}</p>
          <p className="text-xs tabular-nums" style={{ color: '#666666' }}>{formatCurrency(section.total_used)} used</p>
        </div>

        <div className="hidden md:block flex-shrink-0" style={{ width: '56px' }}>
          <div className="rounded-full overflow-hidden" style={{ height: '4px', backgroundColor: '#EEEEEE' }}>
            <div style={{ width: `${Math.min(100, section.usage_pct)}%`, backgroundColor: color, height: '100%' }} />
          </div>
          <p className="text-xs mt-0.5 text-right tabular-nums" style={{ color }}>{section.usage_pct.toFixed(0)}%</p>
        </div>

        {editingTitle && (
          <button type="button" onClick={(e) => { e.stopPropagation(); saveTitle() }} disabled={savingTitle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg flex-shrink-0 disabled:opacity-60"
            style={{ backgroundColor: '#00236F' }}>
            {savingTitle && <Spinner size={12} />}
            {savingTitle ? 'Saving…' : 'Save'}
          </button>
        )}

        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-gray-50" style={{ color: '#BBBBBB' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-md py-1"
              style={{ border: '1px solid #EEEEEE', minWidth: '160px' }}>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50" style={{ color: '#111111' }}
                onClick={() => { setEditTitle(true); setExpanded(true); setMenuOpen(false) }}>
                Edit section name
              </button>
              <button type="button" className="w-full text-left px-4 py-2 text-sm hover:bg-red-50" style={{ color: '#E24B4A' }}
                onClick={() => { setShowDelete(true); setMenuOpen(false) }}>
                Delete section
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {showDelete && (
        <div className="px-4 py-3 border-t" style={{ backgroundColor: '#FFF5F5', borderColor: '#FFCCCC' }}>
          <p className="text-sm mb-2" style={{ color: '#E24B4A' }}>Delete this section and all its items? This cannot be undone.</p>
          <div className="flex gap-2">
            <button type="button" disabled={deleting}
              onClick={async () => { setDeleting(true); await onDeleteSection(section.id); setDeleting(false) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white rounded-lg disabled:opacity-60"
              style={{ backgroundColor: '#E24B4A' }}>
              {deleting && <Spinner size={12} />}
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
            <button type="button" onClick={() => setShowDelete(false)} disabled={deleting} className="text-xs" style={{ color: '#666666' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Expanded body */}
      {expanded && (
        <div className="border-t" style={{ borderColor: '#EEEEEE' }}>
          <BOQSectionBody section={section} onAddItem={onAddItem} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} />
        </div>
      )}
    </div>
  )
}
