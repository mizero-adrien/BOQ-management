'use client'

import type { PurchaseOrder } from '@/hooks/usePurchaseOrders'

interface Props {
  orders: PurchaseOrder[]
}

export default function OverdueDeliveriesList({ orders }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const overdue = orders.filter(
    (o) => o.expected_delivery_date && o.expected_delivery_date < today
  )

  if (overdue.length === 0) {
    return (
      <div className="bg-white rounded-xl px-4 py-8 text-center" style={{ border: '1px solid #EEEEEE' }}>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No overdue deliveries</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {overdue.map((order) => {
        const daysOverdue = Math.floor(
          (new Date().getTime() - new Date(order.expected_delivery_date!).getTime()) / (1000 * 60 * 60 * 24)
        )
        return (
          <div
            key={order.id}
            className="bg-white rounded-xl px-4 py-3"
            style={{ border: '1px solid #E24B4A', borderLeft: '4px solid #E24B4A' }}
          >
            <p className="text-sm font-semibold truncate" style={{ color: '#111111' }}>
              PO {order.po_number}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#666666' }}>
              {order.request_title} &middot; {order.supplier_name}
            </p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#E24B4A' }}>
              {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue
            </p>
          </div>
        )
      })}
    </div>
  )
}
