'use client'

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
  return (
    <div className="flex flex-col gap-2">
      {sections.map((section) => (
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
