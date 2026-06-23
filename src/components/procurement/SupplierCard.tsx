'use client'

import { useState } from 'react'
import type { Supplier } from '@/hooks/useSuppliers'

interface Props {
  supplier: Supplier
  onEdit: (supplier: Supplier) => void
  onRemove: (id: string) => void
}

export default function SupplierCard({ supplier, onEdit, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="bg-white rounded-xl px-4 py-4" style={{ border: '1px solid #EEEEEE' }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: '#111111' }}>{supplier.name}</p>
          {supplier.category && (
            <span
              className="inline-block text-xs font-medium rounded-full px-2 py-0.5 mt-1"
              style={{ backgroundColor: '#E4E9FA', color: '#00236F' }}
            >
              {supplier.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit(supplier)}
            className="text-xs font-medium"
            style={{ color: '#00236F' }}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs"
            style={{ color: '#E24B4A' }}
          >
            Remove
          </button>
        </div>
      </div>

      {confirming && (
        <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid #FFCCCC' }}>
          <p className="text-xs" style={{ color: '#E24B4A' }}>Remove {supplier.name}?</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onRemove(supplier.id)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
              style={{ backgroundColor: '#E24B4A' }}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs px-2 py-1.5 rounded-lg"
              style={{ color: '#666666' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <div className="space-y-0.5">
        {supplier.contact_name && (
          <p className="text-xs" style={{ color: '#666666' }}>Contact: {supplier.contact_name}</p>
        )}
        {supplier.email && (
          <p className="text-xs" style={{ color: '#666666' }}>{supplier.email}</p>
        )}
        {supplier.phone && (
          <p className="text-xs" style={{ color: '#666666' }}>{supplier.phone}</p>
        )}
        {supplier.address && (
          <p className="text-xs" style={{ color: '#666666' }}>{supplier.address}</p>
        )}
      </div>
    </div>
  )
}
