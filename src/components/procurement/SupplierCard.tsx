'use client'

import type { Supplier } from '@/hooks/useSuppliers'

interface Props {
  supplier: Supplier
  onEdit: (supplier: Supplier) => void
  onRemove: (id: string) => void
}

export default function SupplierCard({ supplier, onEdit, onRemove }: Props) {
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
            onClick={() => onRemove(supplier.id)}
            className="text-xs"
            style={{ color: '#E24B4A' }}
          >
            Remove
          </button>
        </div>
      </div>
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
