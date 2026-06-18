'use client'

import type { PurchaseRequestItem } from '@/hooks/usePurchaseRequests'

interface Props {
  items: PurchaseRequestItem[]
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

export default function RequestItemsTable({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl px-4 py-8 text-center" style={{ border: '1px solid #EEEEEE', backgroundColor: '#F5F6FA' }}>
        <p className="text-sm" style={{ color: '#BBBBBB' }}>No items on this request</p>
      </div>
    )
  }

  const totalEstimated = items.reduce((s, i) => s + (i.estimated_unit_price ?? 0) * i.quantity_requested, 0)

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #EEEEEE' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EEEEEE', backgroundColor: '#F5F6FA' }}>
              <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Description</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Qty</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Unit price</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Total</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold" style={{ color: '#666666' }}>Delivered</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const lineTotal = (item.estimated_unit_price ?? 0) * item.quantity_requested
              const deliveredPct = item.quantity_requested > 0 ? (item.quantity_delivered / item.quantity_requested) * 100 : 0
              return (
                <tr key={item.id} style={{ borderBottom: idx < items.length - 1 ? '1px solid #EEEEEE' : undefined }}>
                  <td className="px-4 py-3">
                    <p className="text-sm" style={{ color: '#111111' }}>{item.description}</p>
                    {item.notes && <p className="text-xs mt-0.5" style={{ color: '#BBBBBB' }}>{item.notes}</p>}
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#111111' }}>
                    {item.quantity_requested} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: '#666666' }}>
                    {item.estimated_unit_price != null ? fmt(item.estimated_unit_price) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium" style={{ color: '#111111' }}>
                    {item.estimated_unit_price != null ? fmt(lineTotal) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm" style={{ color: deliveredPct >= 100 ? '#5DCAA5' : '#666666' }}>
                    {item.quantity_delivered} / {item.quantity_requested}
                  </td>
                </tr>
              )
            })}
          </tbody>
          {totalEstimated > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid #EEEEEE' }}>
                <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-right" style={{ color: '#666666' }}>Total estimated</td>
                <td className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#00236F' }}>{fmt(totalEstimated)} RWF</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
