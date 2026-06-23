'use client'

import { useState } from 'react'
import BOQSectionCard from '@/components/pm/boq/BOQSectionCard'
import AddSectionForm from '@/components/pm/boq/AddSectionForm'
import type { BOQSectionWithItems, NewBOQItem, BOQItemUpdate } from '@/hooks/usePMBOQ'

interface Props {
  sections: BOQSectionWithItems[]
  projectId: string
  showAddForm: boolean
  onFormClose: () => void
  onAddSection: (title: string, pid: string) => Promise<string | null>
  onUpdateSection: (id: string, title: string) => Promise<void>
  onDeleteSection: (id: string) => Promise<void>
  onAddItem: (sectionId: string, item: NewBOQItem) => Promise<void>
  onUpdateItem: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

export default function BOQSectionList({
  sections, projectId, showAddForm, onFormClose,
  onAddSection, onUpdateSection, onDeleteSection,
  onAddItem, onUpdateItem, onDeleteItem,
}: Props) {
  const [query, setQuery] = useState('')

  const q = query.toLowerCase().trim()
  const filtered = q
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.items.some((i) => i.description.toLowerCase().includes(q))
      )
    : sections

  return (
    <div className="flex flex-col gap-2">
      {sections.length >= 3 && (
        <div className="relative mb-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" width="14" height="14"
            viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sections or items…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl outline-none"
            style={{ backgroundColor: '#FFFFFF', border: '1px solid #EEEEEE', color: '#111111' }}
          />
          {query && (
            <button type="button" onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#BBBBBB' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {q && filtered.length === 0 && (
        <p className="text-sm text-center py-6" style={{ color: '#BBBBBB' }}>No sections or items match &ldquo;{query}&rdquo;</p>
      )}

      {filtered.map((section) => (
        <BOQSectionCard
          key={section.id}
          section={section}
          onUpdateSection={onUpdateSection}
          onDeleteSection={onDeleteSection}
          onAddItem={onAddItem}
          onUpdateItem={onUpdateItem}
          onDeleteItem={onDeleteItem}
        />
      ))}

      {showAddForm && (
        <AddSectionForm
          projectId={projectId}
          onSave={onAddSection}
          onCancel={onFormClose}
        />
      )}
    </div>
  )
}
