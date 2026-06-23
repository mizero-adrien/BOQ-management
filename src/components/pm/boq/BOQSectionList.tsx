'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
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
  onReorderSections: (reordered: BOQSectionWithItems[]) => Promise<void>
  onAddItem: (sectionId: string, item: NewBOQItem) => Promise<void>
  onUpdateItem: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

interface SortableSectionProps {
  section: BOQSectionWithItems
  onUpdateSection: (id: string, title: string) => Promise<void>
  onDeleteSection: (id: string) => Promise<void>
  onAddItem: (sectionId: string, item: NewBOQItem) => Promise<void>
  onUpdateItem: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

function SortableSection({ section, ...cardProps }: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
        zIndex: isDragging ? 10 : 'auto',
        position: 'relative',
      }}
    >
      <BOQSectionCard
        section={section}
        dragHandleProps={{ ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>}
        {...cardProps}
      />
    </div>
  )
}

export default function BOQSectionList({
  sections, projectId, showAddForm, onFormClose,
  onAddSection, onUpdateSection, onDeleteSection, onReorderSections,
  onAddItem, onUpdateItem, onDeleteItem,
}: Props) {
  const [query, setQuery] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  )

  const q = query.toLowerCase().trim()
  const filtered = q
    ? sections.filter((s) =>
        s.title.toLowerCase().includes(q) ||
        s.items.some((i) => i.description.toLowerCase().includes(q))
      )
    : sections

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = sections.findIndex((s) => s.id === active.id)
    const newIdx = sections.findIndex((s) => s.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return
    onReorderSections(arrayMove(sections, oldIdx, newIdx))
  }

  const cardProps = { onUpdateSection, onDeleteSection, onAddItem, onUpdateItem, onDeleteItem }

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

      {/* Filtered search view — plain list, no drag */}
      {q ? (
        filtered.map((section) => (
          <BOQSectionCard key={section.id} section={section} {...cardProps} />
        ))
      ) : (
        /* Default view — sortable */
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection key={section.id} section={section} {...cardProps} />
            ))}
          </SortableContext>
        </DndContext>
      )}

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
