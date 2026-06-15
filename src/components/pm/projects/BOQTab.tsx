'use client'

import { useState } from 'react'
import { usePMBOQ } from '@/hooks/usePMBOQ'
import type { ParsedBOQSection } from '@/lib/boq/parseExcel'
import BOQSummaryCards from '@/components/pm/boq/BOQSummaryCards'
import BOQSectionCard from '@/components/pm/boq/BOQSectionCard'
import AddSectionForm from '@/components/pm/boq/AddSectionForm'
import ImportBOQModal from '@/components/pm/boq/ImportBOQModal'

export default function BOQTab({ projectId }: { projectId: string }) {
  const [showAddSection, setShowAddSection] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const {
    sections, loading, summary,
    addSection, bulkAddItems, updateSection, deleteSection,
    addItem, updateItem, deleteItem,
  } = usePMBOQ(projectId)

  async function handleImport(parsedSections: ParsedBOQSection[]) {
    for (const sec of parsedSections) {
      const sectionId = await addSection(sec.title, projectId)
      if (sectionId && sec.items.length > 0) {
        await bulkAddItems(sectionId, sec.items.map((item, i) => ({ ...item, order_index: i + 1 })))
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl animate-pulse" style={{ height: '64px', backgroundColor: '#EEEEEE' }} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button type="button" onClick={() => setShowImport(true)}
          className="px-3 py-2 rounded-lg text-xs font-medium"
          style={{ border: '1px solid #00236F', color: '#00236F' }}>
          Import PDF / Excel
        </button>
        <button type="button" onClick={() => setShowAddSection(true)}
          className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
          style={{ backgroundColor: '#00236F' }}>
          Add section
        </button>
      </div>

      {sections.length > 0 && (
        <BOQSummaryCards summary={summary} />
      )}

      {sections.length === 0 && !showAddSection ? (
        <div className="bg-white rounded-xl p-10 text-center" style={{ border: '0.5px solid #EEEEEE' }}>
          <p className="font-semibold mb-1" style={{ color: '#111111' }}>No BOQ sections yet</p>
          <p className="text-sm" style={{ color: '#666666' }}>Add sections manually or import from a PDF or Excel file.</p>
        </div>
      ) : (
        <>
          {sections.map((section) => (
            <BOQSectionCard key={section.id} section={section}
              onUpdateSection={updateSection} onDeleteSection={deleteSection}
              onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem} />
          ))}
          {showAddSection && (
            <AddSectionForm projectId={projectId} onSave={addSection} onCancel={() => setShowAddSection(false)} />
          )}
        </>
      )}

      {showImport && <ImportBOQModal onImport={handleImport} onClose={() => setShowImport(false)} />}
    </div>
  )
}
