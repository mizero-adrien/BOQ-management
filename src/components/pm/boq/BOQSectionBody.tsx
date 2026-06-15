'use client'

import { useState } from 'react'
import type { PMBOQSection, NewBOQItem, BOQItemUpdate } from '@/hooks/usePMBOQ'
import BOQItemRow from './BOQItemRow'
import BOQItemCard from './BOQItemCard'
import AddItemForm from './AddItemForm'

interface Props {
  section: PMBOQSection
  onAddItem: (sectionId: string, item: NewBOQItem) => Promise<void>
  onUpdateItem: (id: string, updates: BOQItemUpdate) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
}

const TABLE_COLS = ['Description', 'Unit', 'Qty', 'Unit Rate (RWF)', 'Budgeted', 'Used Qty', 'Used Total', '% Used', 'Status', '']

export default function BOQSectionBody({ section, onAddItem, onUpdateItem, onDeleteItem }: Props) {
  const [showAdd, setShowAdd] = useState(false)

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#F5F6FA' }}>
              {TABLE_COLS.map((col, i) => (
                <th key={i} className="px-3 py-2 text-left whitespace-nowrap"
                  style={{ fontSize: '11px', fontWeight: 600, color: '#666666' }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <BOQItemRow key={item.id} item={item} onSave={onUpdateItem} onDelete={onDeleteItem} />
            ))}
            {showAdd && (
              <AddItemForm
                sectionId={section.id}
                nextOrderIndex={section.items.length + 1}
                onSave={onAddItem}
                onCancel={() => setShowAdd(false)}
              />
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden px-3 pt-3">
        {section.items.map((item) => (
          <BOQItemCard key={item.id} item={item} onSave={onUpdateItem} onDelete={onDeleteItem} />
        ))}
        {section.items.length === 0 && !showAdd && (
          <p className="text-xs text-center py-3" style={{ color: '#BBBBBB' }}>No items yet</p>
        )}
      </div>

      {/* Add item trigger */}
      <div className="px-4 py-2.5">
        {showAdd ? (
          <p className="text-xs" style={{ color: '#BBBBBB' }}>Fill in the row above to add an item</p>
        ) : (
          <button type="button" onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-sm" style={{ color: '#00236F' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add line item
          </button>
        )}
      </div>
    </>
  )
}
