'use client'

import { useState, useEffect } from 'react'
import type { Supplier, CreateSupplierParams } from '@/hooks/useSuppliers'

interface Props {
  initial?: Supplier | null
  onSave: (params: CreateSupplierParams) => Promise<boolean>
  onClose: () => void
}

const F: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '14px',
  borderRadius: '8px', border: '1px solid #EEEEEE',
  backgroundColor: '#F5F6FA', color: '#111111', outline: 'none',
}

const L: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 600, color: '#111111', marginBottom: '4px' }

export default function SupplierFormModal({ initial, onSave, onClose }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [contactName, setContactName] = useState(initial?.contact_name ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [address, setAddress] = useState(initial?.address ?? '')
  const [category, setCategory] = useState(initial?.category ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setName(initial.name); setContactName(initial.contact_name ?? '')
      setEmail(initial.email ?? ''); setPhone(initial.phone ?? '')
      setAddress(initial.address ?? ''); setCategory(initial.category ?? '')
      setNotes(initial.notes ?? '')
    }
  }, [initial])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const ok = await onSave({
      name: name.trim(), contact_name: contactName || undefined,
      email: email || undefined, phone: phone || undefined,
      address: address || undefined, category: category || undefined,
      notes: notes || undefined,
    })
    setSaving(false)
    if (ok) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ border: '1px solid #EEEEEE' }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: '#EEEEEE' }}>
          <h2 className="font-semibold" style={{ color: '#111111' }}>{initial ? 'Edit supplier' : 'Add supplier'}</h2>
          <button type="button" onClick={onClose} style={{ color: '#BBBBBB', fontSize: '20px' }}>&#x2715;</button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          <div><label style={L}>Company name <span style={{ color: '#E24B4A' }}>*</span></label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={F} />
          </div>
          <div><label style={L}>Contact name</label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} style={F} />
          </div>
          <div><label style={L}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={F} />
          </div>
          <div><label style={L}>Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} style={F} />
          </div>
          <div><label style={L}>Category</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Electrical, Cement, Tools" style={F} />
          </div>
          <div><label style={L}>Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} style={F} />
          </div>
          <div><label style={L}>Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...F, resize: 'none' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium"
              style={{ border: '1px solid #EEEEEE', color: '#666666' }}>Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ backgroundColor: saving ? '#BBBBBB' : '#00236F' }}>
              {saving ? 'Saving...' : initial ? 'Save changes' : 'Add supplier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
