'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useSuppliers } from '@/hooks/useSuppliers'
import type { Supplier, CreateSupplierParams } from '@/hooks/useSuppliers'
import SupplierCard from '@/components/procurement/SupplierCard'
import SupplierFormModal from '@/components/procurement/SupplierFormModal'

export default function SuppliersPage() {
  const { suppliers, loading, createSupplier, updateSupplier, deactivateSupplier } = useSuppliers()
  const [showModal, setShowModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [search, setSearch] = useState('')

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.category ?? '').toLowerCase().includes(search.toLowerCase())
  )

  async function handleSave(params: CreateSupplierParams): Promise<boolean> {
    if (editTarget) {
      const ok = await updateSupplier(editTarget.id, params)
      if (ok) { setShowModal(false); setEditTarget(null) }
      return ok
    }
    const ok = await createSupplier(params)
    if (ok) { setShowModal(false) }
    return ok
  }

  function handleEdit(supplier: Supplier) {
    setEditTarget(supplier)
    setShowModal(true)
  }

  async function handleRemove(id: string) {
    await deactivateSupplier(id)
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#111111', marginBottom: '4px' }}>Suppliers</h1>
            <p style={{ fontSize: '14px', color: '#666666' }}>{suppliers.length} active suppliers</p>
          </div>
          <button
            type="button"
            onClick={() => { setEditTarget(null); setShowModal(true) }}
            style={{ padding: '10px 20px', backgroundColor: '#00236F', color: '#FFFFFF',
              border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
          >
            Add supplier
          </button>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or category..."
          style={{ width: '100%', padding: '12px', fontSize: '14px', borderRadius: '10px',
            border: '1px solid #EEEEEE', backgroundColor: '#FFFFFF', color: '#111111',
            outline: 'none', marginBottom: '16px', boxSizing: 'border-box' }}
        />

        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl animate-pulse mb-3" style={{ height: '80px', backgroundColor: '#EEEEEE' }} />
          ))
        ) : filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#BBBBBB', padding: '60px 0', fontSize: '14px' }}>
            {search ? 'No suppliers match your search' : 'No suppliers yet'}
          </p>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <SupplierCard key={s.id} supplier={s} onEdit={handleEdit} onRemove={handleRemove} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <SupplierFormModal
          initial={editTarget}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditTarget(null) }}
        />
      )}
    </div>
  )
}
