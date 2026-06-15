'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { usePMProjects } from '@/hooks/usePMProjects'
import { usePMBOQ } from '@/hooks/usePMBOQ'
import type { ParsedBOQSection } from '@/lib/boq/parseExcel'
import BOQSummaryCards from '@/components/pm/boq/BOQSummaryCards'
import BOQSectionList from '@/components/pm/boq/BOQSectionList'
import BOQSkeleton from '@/components/pm/boq/BOQSkeleton'
import EmptyBOQState from '@/components/pm/boq/EmptyBOQState'
import ImportBOQModal from '@/components/pm/boq/ImportBOQModal'

export default function PMBOQPage() {
  const { projects, loading: projectsLoading } = usePMProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showImport, setShowImport] = useState(false)

  // Auto-select first project once the list arrives
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const {
    sections, loading: boqLoading, error, summary,
    addSection, bulkAddItems, updateSection, deleteSection,
    addItem, updateItem, deleteItem,
  } = usePMBOQ(selectedProjectId)

  const isLoading = projectsLoading || !selectedProjectId || boqLoading

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  async function handleImport(parsedSections: ParsedBOQSection[]) {
    if (!selectedProjectId) return
    for (const sec of parsedSections) {
      const sectionId = await addSection(sec.title, selectedProjectId)
      if (sectionId && sec.items.length > 0) {
        await bulkAddItems(sectionId, sec.items.map((item, i) => ({ ...item, order_index: i + 1 })))
      }
    }
    setShowImport(false)
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>Bill of Quantities</h1>
          <p className="text-sm" style={{ color: '#666666' }}>Manage and track project budgets</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="hidden md:block px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Import PDF / Excel
          </button>
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="md:hidden px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => setShowAddSection(true)}
            className="px-3 py-2 rounded-lg text-xs font-semibold text-white"
            style={{ backgroundColor: '#00236F' }}
          >
            Add section
          </button>
        </div>
      </div>

      {/* Project selector */}
      {projects.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6" style={{ scrollbarWidth: 'none' }}>
          {projects.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelectedProjectId(p.id); setShowAddSection(false) }}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={p.id === selectedProjectId
                ? { backgroundColor: '#00236F', color: '#FFFFFF' }
                : { backgroundColor: '#FFFFFF', color: '#666666', border: '1px solid #EEEEEE' }}
            >
              {p.name}
            </button>
          ))}
        </div>
      ) : selectedProject ? (
        <p className="text-sm font-medium mb-4" style={{ color: '#666666' }}>{selectedProject.name}</p>
      ) : null}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ backgroundColor: '#FFF5F5', color: '#E24B4A', border: '1px solid #FFCCCC' }}>
          {error}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <BOQSkeleton />
      ) : !error && sections.length === 0 ? (
        <EmptyBOQState
          onAdd={() => setShowAddSection(true)}
          onImport={() => setShowImport(true)}
        />
      ) : !error && sections.length > 0 ? (
        <>
          <BOQSummaryCards summary={summary} />
          <BOQSectionList
            sections={sections}
            projectId={selectedProjectId!}
            showAddForm={showAddSection}
            onFormClose={() => setShowAddSection(false)}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onAddItem={addItem}
            onUpdateItem={updateItem}
            onDeleteItem={deleteItem}
          />
        </>
      ) : null}

      {showImport && (
        <ImportBOQModal onImport={handleImport} onClose={() => setShowImport(false)} />
      )}
    </div>
  )
}
