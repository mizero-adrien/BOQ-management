'use client'

import type { PurchaseOrder } from '@/hooks/usePurchaseOrders'

interface Props {
  order: PurchaseOrder
  onRecordDelivery?: (orderId: string) => void
}

export default function OrderCard({ order, onRecordDelivery }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = order.expected_delivery_date && order.expected_delivery_date < today

  return (
    <div
      className="bg-white rounded-xl px-4 py-4"
      style={{ border: `1px solid ${isOverdue ? '#E24B4A' : '#EEEEEE'}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className="text-sm font-semibold" style={{ color: '#111111' }}>PO {order.po_number}</p>
        {isOverdue && (
          <span className="text-xs font-semibold rounded-full px-2.5 py-1" style={{ backgroundColor: '#FEE2E2', color: '#991B1B' }}>
            Overdue
          </span>
        )}
      </div>
      <p className="text-xs mb-0.5" style={{ color: '#666666' }}>{order.request_title}</p>
      <p className="text-xs mb-2" style={{ color: '#666666' }}>Supplier: {order.supplier_name}</p>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold" style={{ color: '#00236F' }}>
            {order.total_amount.toLocaleString()} RWF
          </p>
          {order.expected_delivery_date && (
            <p className="text-xs mt-0.5" style={{ color: isOverdue ? '#E24B4A' : '#666666' }}>
              Expected {new Date(order.expected_delivery_date).toLocaleDateString()}
            </p>
          )}
        </div>
        {onRecordDelivery && (
          <button
            type="button"
            onClick={() => onRecordDelivery(order.id)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid #00236F', color: '#00236F' }}
          >
            Record delivery
          </button>
        )}
      </div>
    </div>
  )
}
