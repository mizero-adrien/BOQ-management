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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid #DDE3E8', borderTopColor: '#1565D8', animation: 'spin 0.8s linear infinite', marginBottom: '14px' }} />
        <p style={{ fontSize: '13px', color: '#8FA3B3' }}>Loading BOQ data...</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#F4F6F8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', border: '0.5px solid #DDE3E8' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#8FA3B3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
              <line x1="2" y1="20" x2="22" y2="20" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1A2332', marginBottom: '8px' }}>
            No BOQ sections yet
          </h3>
          <p style={{ fontSize: '13px', color: '#5C7080', marginBottom: '24px', maxWidth: '320px', lineHeight: '1.6' }}>
            This project does not have a Bill of Quantities yet.
            Import an existing BOQ from Excel or PDF, or go to the
            BOQ page to add sections manually.
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setShowAddSection(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#1565D8', color: '#FFFFFF', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add BOQ sections
            </button>
            <button
              type="button"
              onClick={() => setShowImport(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', backgroundColor: '#FFFFFF', color: '#1A2332', border: '1px solid #DDE3E8', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Import BOQ
            </button>
          </div>
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
