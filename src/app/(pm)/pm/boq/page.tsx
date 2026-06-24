'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { usePMProjects } from '@/hooks/usePMProjects'
import { usePMBOQ } from '@/hooks/usePMBOQ'
import type { ParsedBOQSection } from '@/lib/boq/parseExcel'
import BOQSummaryCards from '@/components/pm/boq/BOQSummaryCards'
import BOQSectionList from '@/components/pm/boq/BOQSectionList'
import EmptyBOQState from '@/components/pm/boq/EmptyBOQState'
import ImportBOQModal from '@/components/pm/boq/ImportBOQModal'
import AddSectionForm from '@/components/pm/boq/AddSectionForm'
import NoProjectsBOQCard from '@/components/pm/boq/NoProjectsBOQCard'
import ProjectsFetchError from '@/components/pm/ProjectsFetchError'
import { toast } from '@/lib/toast'
import AIQuantityCalculator, { type CalculatedItem } from '@/components/pm/boq/AIQuantityCalculator'

export default function PMBOQPage() {
  const { projects, loading: projectsLoading, error: projectsError } = usePMProjects()
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showAddSection, setShowAddSection] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  const {
    sections, loading: boqLoading, error, summary,
    addSection, bulkAddItems, updateSection, deleteSection, reorderSections,
    addItem, updateItem, deleteItem,
  } = usePMBOQ(selectedProjectId)

  // Only show skeleton while projects are loading or while BOQ loads for a selected project
  const isLoading = projectsLoading || (projects.length > 0 && (!selectedProjectId || boqLoading))

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  function handleImportClick() {
    if (!selectedProjectId) {
      toast.info('No project selected', 'Create a project first to start your BOQ')
      return
    }
    setShowImport(true)
  }

  function handleAddSectionClick() {
    if (!selectedProjectId) {
      toast.info('No project selected', 'Create a project first to start your BOQ')
      return
    }
    setShowAddSection(true)
  }

  async function handleAddSection(title: string, pid: string): Promise<string | null> {
    const id = await addSection(title, pid)
    if (id) {
      toast.success('Section added', title + ' has been added to the BOQ')
      setShowAddSection(false)
    } else {
      toast.error('Could not add section', 'Please try again')
    }
    return id
  }

  async function handleCalculatorItems(items: CalculatedItem[]) {
    if (!selectedProjectId) return
    const sectionId = await addSection('AI Calculator Results', selectedProjectId)
    if (sectionId) {
      await bulkAddItems(sectionId, items.map((item, idx) => ({
        description: item.description,
        unit: item.unit,
        quantity: item.quantity,
        unit_rate: item.unit_rate_estimate,
        order_index: idx + 1,
      })))
      toast.success('Items added', `${items.length} items added to new BOQ section`)
      setShowCalculator(false)
    } else {
      toast.error('Could not create section', 'Please try again')
    }
  }

  async function handleImport(parsedSections: ParsedBOQSection[], onProgress: (done: number, total: number) => void) {
    if (!selectedProjectId) return
    for (let i = 0; i < parsedSections.length; i++) {
      onProgress(i, parsedSections.length)
      const sec = parsedSections[i]
      const sectionId = await addSection(sec.title, selectedProjectId)
      if (sectionId && sec.items.length > 0) {
        await bulkAddItems(sectionId, sec.items.map((item, idx) => ({ ...item, order_index: idx + 1 })))
      }
      onProgress(i + 1, parsedSections.length)
    }
    setShowImport(false)
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header — always visible */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>Bill of Quantities</h1>
          <p className="text-sm" style={{ color: '#666666' }}>Manage and track project budgets</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleImportClick}
            className="hidden md:block px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Import PDF / Excel
          </button>
          <button
            type="button"
            onClick={handleImportClick}
            className="md:hidden px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Import
          </button>
          <button
            type="button"
            onClick={() => setShowCalculator((v) => !v)}
            className="hidden md:block px-3 py-2 rounded-lg text-xs font-medium"
            style={{ border: '1px solid #778EDE', color: '#778EDE', backgroundColor: showCalculator ? '#E4E9FA' : 'transparent' }}
          >
            AI Calculator
          </button>
          <button
            type="button"
            onClick={handleAddSectionClick}
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

      {/* Add section form */}
      {!isLoading && showAddSection && selectedProjectId && (
        <AddSectionForm
          projectId={selectedProjectId}
          onSave={handleAddSection}
          onCancel={() => setShowAddSection(false)}
        />
      )}

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '80px', paddingBottom: '80px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #EEEEEE', borderTopColor: '#00236F', animation: 'spin 0.8s linear infinite', marginBottom: '16px' }} />
          <p style={{ fontSize: '14px', color: '#666666', fontWeight: 500 }}>Loading BOQ data...</p>
          <p style={{ fontSize: '12px', color: '#BBBBBB', marginTop: '4px' }}>This may take a moment</p>
        </div>
      ) : projectsError ? (
        <ProjectsFetchError />
      ) : projects.length === 0 ? (
        <NoProjectsBOQCard />
      ) : !error && sections.length === 0 ? (
        <>
          {showCalculator && selectedProjectId && (
            <div style={{ marginBottom: '16px' }}>
              <AIQuantityCalculator onAddItems={handleCalculatorItems} />
            </div>
          )}
          <EmptyBOQState
            onAdd={() => setShowAddSection(true)}
            onImport={() => setShowImport(true)}
          />
        </>
      ) : !error && sections.length > 0 ? (
        <>
          {showCalculator && selectedProjectId && (
            <div style={{ marginBottom: '16px' }}>
              <AIQuantityCalculator onAddItems={handleCalculatorItems} />
            </div>
          )}
          <BOQSummaryCards summary={summary} />
          <BOQSectionList
            sections={sections}
            projectId={selectedProjectId!}
            showAddForm={false}
            onFormClose={() => setShowAddSection(false)}
            onAddSection={addSection}
            onUpdateSection={updateSection}
            onDeleteSection={deleteSection}
            onReorderSections={reorderSections}
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
